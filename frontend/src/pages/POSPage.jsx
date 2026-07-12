// src/pages/POSPage.jsx
//
// Module 5: Point of Sale
// Shopping cart, checkout, and receipt generation.

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function POSPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const canCheckout = ["cashier", "manager", "admin"].includes(currentUser?.role);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.products.filter((p) => p.stock > 0));
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load products");
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, item.stock) }
            : item
        )
      );
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod,
        notes: "",
      };

      const response = await api.post("/pos/orders", orderData);
      
      setSuccess(`Order #${response.data.order.orderNo} created successfully!`);
      setCart([]);
      setPaymentMethod("cash");
      loadProducts(); // Refresh product stock

      // Print receipt after 1 second
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to process order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
          <p className="text-gray-600 mt-1">Create and manage sales transactions</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>

              {/* Search */}
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
              />

              {/* Products Grid */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading products...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 col-span-2">No products found</div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-semibold text-blue-600">₱{product.price.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">{product.stock} in stock</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Shopping Cart</h2>

              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pb-4 border-b">
                {cart.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="border rounded-lg p-3">
                      <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="w-12 px-2 py-1 border rounded text-center text-sm"
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium text-gray-800">{totalItems}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-blue-600">₱{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  
                </select>
              </div>

              {/* Checkout Button */}
              {canCheckout && (
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Checkout (₱{totalAmount.toFixed(2)})
                </button>
              )}

              {/* Clear Cart */}
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="w-full mt-2 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
