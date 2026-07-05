import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import serviceAccount from "../../firebase-service-account.json" with { type: "json" };

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function getProducts() {
  const snapshot = await db.collection("products").get();

  if (snapshot.empty) {
    throw new Error(
      "No products found. Please add products before running the seeder."
    );
  }

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedSales() {

    console.log("Loading products from Firestore...");

  const products = await getProducts();

  console.log(`Found ${products.length} products.\n`);

  console.log("Seeding 30 days of historical sales...\n");

  const today = new Date();

  for (let day = 30; day >= 1; day--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - day);

    const dateString = currentDate.toISOString().split("T")[0];

    // Generate 5–10 sales each day
    const salesToday = randomInt(5, 10);

    for (let i = 0; i < salesToday; i++) {
      const saleRef = db.collection("sales").doc();

      let totalAmount = 0;
      const items = [];

      // Each sale contains 1–3 products
      const itemCount = randomInt(1, 3);

      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];

        const quantity = randomInt(1, 3);
        const subtotal = quantity * product.price;

        totalAmount += subtotal;

        items.push({
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity,
          price: product.price,
          subtotal,
        });
      }

      await saleRef.set({
        saleId: saleRef.id,
        cashierId: "CASHIER001",
        saleDate: currentDate.toISOString(),
        date: currentDate.toISOString(),
        totalAmount,
        paymentMethod: "Cash",
        status: "completed",
        items,
        createdAt: new Date(currentDate).toISOString(),
      });

      console.log(
        `✔ ${dateString} | Sale ${saleRef.id} | ₱${totalAmount}`
      );
    }
  }

  console.log("\n✅ Finished generating historical sales data!");
}

seedSales()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });