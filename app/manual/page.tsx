'use client';
import { useState } from 'react';
import { motion } from "motion/react"

import ItemsTable, { type Item } from '@/components/items-table';
import PeopleEditor from '@/components/people-editor';
import Summary from '@/components/summary';

export default function ManualPage() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Burger', qty: 1, price: 12.99, people: [] },
    { id: '2', name: 'Fries', qty: 1, price: 4.5, people: [] },
  ]);
  const [people, setPeople] = useState<string[]>(['You']);
  const [taxPct, setTaxPct] = useState(0.13);
  const [tipPct, setTipPct] = useState(0.18);

  function addItem(){ const idx = items.length+1; setItems([...items, { id: String(idx), name: 'New Item', qty: 1, price: 0, people: [] }]); }

  return (
    <div className="relative min-h-screen">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,154,0,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,69,0,0.08),transparent_70%)]" />
      </div>
      
      {/* Floating elements */}
      <motion.div
        className="fixed top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-r from-orange-200/30 to-amber-200/30 blur-xl"
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="fixed bottom-32 right-32 w-24 h-24 rounded-full bg-gradient-to-r from-red-200/30 to-orange-200/30 blur-xl"
        animate={{
          y: [10, -10, 10],
          x: [5, -5, 5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative space-y-6 max-w-6xl mx-auto px-4 py-10 mt-20">
        <div><h1 className="text-2xl font-bold">Manual Entry</h1><p className="text-neutral-600">Enter items yourself if the receipt photo is messy or missing.</p></div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2"><div className="font-semibold">Items</div></div>
              <ItemsTable items={items} setItems={setItems} people={people} />
            </div>
            <div className="card grid grid-cols-3 gap-3">
              <label className="text-sm"><div className="text-white font-bold text-sm">Tax %</div><input type="number" value={(taxPct*100).toFixed(0)} onChange={e => setTaxPct(Number(e.target.value)/100)} className="w-full rounded-xl border px-3 py-2" /></label>
              <label className="text-sm"><div className="text-white font-bold text-sm">Tip %</div><input type="number" value={(tipPct*100).toFixed(0)} onChange={e => setTipPct(Number(e.target.value)/100)} className="w-full rounded-xl border px-3 py-2" /></label>
            </div>
          </div>
          <div className="space-y-4">
            <PeopleEditor people={people} setPeople={setPeople} />
            <Summary items={items} people={people} subtotal={0} tipPct={tipPct} taxPct={taxPct} />
          </div>
        </div>
      </div>
    </div>
  );
}