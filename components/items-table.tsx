'use client';
import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from "motion/react";

import { Check, Minus, Edit2, Trash2, Plus } from 'lucide-react';

export type Item = { 
  id: string; 
  name: string; 
  qty: number; 
  price: number; 
  people: string[]; 
};

export default function ItemsTable({ 
  items, 
  setItems, 
  people 
}: { 
  items: Item[]; 
  setItems: (i: Item[]) => void; 
  people: string[]; 
}) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; qty: number; price: number }>({ name: '', qty: 1, price: 0 });

  function togglePerson(itemId: string, person: string) {
    const next = items.map(it => 
      it.id !== itemId ? it : { 
        ...it, 
        people: it.people.includes(person) 
          ? it.people.filter(p => p !== person) 
          : [...it.people, person] 
      }
    );
    setItems(next);
  }

  function startEdit(item: Item) {
    setEditingItem(item.id);
    setEditValues({ name: item.name, qty: item.qty, price: item.price });
  }

  function saveEdit() {
    if (!editingItem) return;
    const next = items.map(it => 
      it.id !== editingItem ? it : { 
        ...it, 
        name: editValues.name,
        qty: editValues.qty,
        price: editValues.price
      }
    );
    setItems(next);
    setEditingItem(null);
  }

  function deleteItem(itemId: string) {
    setItems(items.filter(it => it.id !== itemId));
  }

  function addNewItem() {
    const newItem: Item = {
      id: String(Date.now()),
      name: 'New Item',
      qty: 1,
      price: 0,
      people: []
    };
    setItems([...items, newItem]);
    startEdit(newItem);
  }

  const columns = useMemo(() => people, [people]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Receipt Items</h3>
        <motion.button
          onClick={addNewItem}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Add Item
        </motion.button>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 bg-gray-50/50">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Item</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Qty</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Price</th>
                {columns.map(person => (
                  <th key={person} className="text-center py-4 px-3 font-semibold text-gray-700 text-sm min-w-[80px]">
                    {person}
                  </th>
                ))}
                <th className="py-4 px-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b border-gray-200/30 hover:bg-gray-50/50 transition-colors group"
                  >
                    {/* Item Name */}
                    <td className="py-4 px-6">
                      {editingItem === item.id ? (
                        <input
                          value={editValues.name}
                          onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          autoFocus
                        />
                      ) : (
                        <div className="font-medium text-gray-800">{item.name}</div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-4">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={editValues.qty}
                          onChange={e => setEditValues(prev => ({ ...prev, qty: Number(e.target.value) }))}
                          className="w-16 px-2 py-1 rounded-lg border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-center"
                          min="1"
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                        />
                      ) : (
                        <div className="text-gray-700">{item.qty}</div>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={editValues.price}
                          onChange={e => setEditValues(prev => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-20 px-2 py-1 rounded-lg border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                          step="0.01"
                          min="0"
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                        />
                      ) : (
                        <div className="font-medium text-gray-800">${item.price.toFixed(2)}</div>
                      )}
                    </td>

                    {/* People assignments */}
                    {columns.map(person => (
                      <td key={person} className="py-4 px-3 text-center">
                        <motion.button
                          onClick={() => togglePerson(item.id, person)}
                          className={`relative w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                            item.people.includes(person)
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 shadow-lg shadow-orange-500/25'
                              : 'bg-white border-gray-300 hover:border-orange-300'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <AnimatePresence>
                            {item.people.includes(person) ? (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <Minus className="w-4 h-4 text-gray-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-orange-600 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                📄
              </div>
              <div className="text-lg font-medium">No items yet</div>
              <div className="text-sm">Upload a receipt to get started</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}