// src/components/BarcodeScanner.jsx
import React, { useState } from "react";

export default function BarcodeScanner({ onScan, onClose }) {
  const [barcodeInput, setBarcodeInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onScan(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📷</span> Barcode Scanner Input
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Scan or Enter barcode (e.g. SKU-001)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm cursor-pointer"
        >
          Submit
        </button>
      </form>

      <p className="text-[11px] text-gray-500 italic">
        * Focus input and scan with a hardware scanner, or type the barcode / SKU manually.
      </p>
    </div>
  );
}
