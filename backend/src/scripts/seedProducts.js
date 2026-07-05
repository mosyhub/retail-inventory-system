import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../firebase-service-account.json" with { type: "json" };

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const products = [
  // Beverages
  { name: "Coca-Cola 1.5L", category: "Beverages", price: 90 },
  { name: "Pepsi 1.5L", category: "Beverages", price: 88 },
  { name: "Sprite 1.5L", category: "Beverages", price: 88 },
  { name: "Royal 1.5L", category: "Beverages", price: 88 },
  { name: "Mountain Dew 1.5L", category: "Beverages", price: 88 },
  { name: "Wilkins Water 500ml", category: "Beverages", price: 20 },

  // Instant Foods
  { name: "Lucky Me Pancit Canton Original", category: "Instant Foods", price: 18 },
  { name: "Lucky Me Beef Noodles", category: "Instant Foods", price: 20 },
  { name: "Nissin Cup Noodles", category: "Instant Foods", price: 32 },

  // Coffee & Milk
  { name: "Nescafe Original", category: "Coffee", price: 12 },
  { name: "Kopiko Brown", category: "Coffee", price: 14 },
  { name: "Great Taste White", category: "Coffee", price: 15 },
  { name: "Bear Brand Powdered Milk", category: "Milk", price: 35 },
  { name: "Alaska Evaporated Milk", category: "Milk", price: 42 },

  // Snacks
  { name: "Piattos Cheese", category: "Snacks", price: 22 },
  { name: "Nova Country Cheddar", category: "Snacks", price: 20 },
  { name: "Oishi Prawn Crackers", category: "Snacks", price: 18 },
  { name: "SkyFlakes", category: "Snacks", price: 10 },

  // Canned Goods
  { name: "555 Tuna Afritada", category: "Canned Goods", price: 32 },
  { name: "Argentina Meat Loaf", category: "Canned Goods", price: 30 },
  { name: "Purefoods Corned Beef", category: "Canned Goods", price: 55 },
  { name: "Century Tuna Hot & Spicy", category: "Canned Goods", price: 40 },

  // Bread
  { name: "Gardenia Classic White", category: "Bread", price: 75 },
  { name: "Pinoy Tasty", category: "Bread", price: 60 },

  // Personal Care
  { name: "Safeguard White Soap", category: "Personal Care", price: 45 },
  { name: "Palmolive Shampoo Sachet", category: "Personal Care", price: 8 },
  { name: "Colgate Toothpaste", category: "Personal Care", price: 60 },

  // Household
  { name: "Joy Dishwashing Liquid", category: "Household", price: 12 },
  { name: "Surf Powder Detergent", category: "Household", price: 15 },
  { name: "Zonrox Bleach", category: "Household", price: 28 },
];

async function seedProducts() {
  console.log("Syncing products...\n");

  for (const [index, product] of products.entries()) {
    const sku = `SKU-${String(index + 1).padStart(3, "0")}`;

    const existingSnapshot = await db.collection("products").where("sku", "==", sku).limit(1).get();

    const productData = {
      sku,
      name: product.name,
      description: `${product.name} imported by seeder`,
      category: product.category,
      cost: Math.max(1, Math.floor(product.price * 0.7)),
      price: product.price,
      stock: Math.floor(Math.random() * 50) + 20,
      reorderLevel: 5,
      isActive: true,
      createdBy: "SYSTEM_SEEDER",
      updatedAt: new Date().toISOString(),
    };

    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      await existingDoc.ref.set(productData, { merge: true });
      console.log(`✔ Updated ${product.name} (${sku})`);
    } else {
      await db.collection("products").add({
        ...productData,
        createdAt: new Date().toISOString(),
      });
      console.log(`✔ Added ${product.name} (${sku})`);
    }
  }

  console.log("\n✅ Products synced successfully!");
}

seedProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });