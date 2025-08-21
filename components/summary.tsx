'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Receipt, TrendingUp, Users } from 'lucide-react';
import type { Item } from './items-table';

export default function Summary({ 
  items, 
  people, 
  subtotal, 
  tipPct, 
  taxPct 
}: { 
  items: Item[]; 
  people: string[]; 
  subtotal: number; 
  tipPct: number; 
  taxPct: number; 
}) {
  const perPerson = useMemo(() => {
    const totals: Record<string, number> = {};
    people.forEach(p => totals[p] = 0);
    
    const itemsTotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    
    for (const it of items) {
      const share = it.qty * it.price;
      const splitAmong = Math.max(1, it.people.length);
      const per = share / splitAmong;
      for (const p of (it.people.length ? it.people : people)) {
        totals[p] = (totals[p] ?? 0) + per;
      }
    }
    
    const tax = itemsTotal * taxPct;
    const tip = itemsTotal * tipPct;
    const extra = tax + tip;
    
    for (const p of people) {
      const r = itemsTotal ? (totals[p] / itemsTotal) : 0;
      totals[p] += r * extra;
    }
    
    return { 
      totals, 
      itemsTotal, 
      tax, 
      tip, 
      grand: itemsTotal + tax + tip 
    };
  }, [items, people, taxPct, tipPct]);

  const summaryStats = [
    {
      icon: Receipt,
      label: "Subtotal",
      value: `$${perPerson.itemsTotal.toFixed(2)}`,
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: TrendingUp,
      label: `Tax (${(taxPct * 100)}%)`,
      value: `$${perPerson.tax.toFixed(2)}`,
      color: "from-green-500 to-green-600"
    },
    {
      icon: DollarSign,
      label: `Tip (${(tipPct * 100).toFixed(0)}%)`,
      value: `$${perPerson.tip.toFixed(2)}`,
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      label: "Total",
      value: `$${perPerson.grand.toFixed(2)}`,
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-4 shadow-lg hover:shadow-black/25 transition-all duration-300"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {stat.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Per Person Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-black/25 transition-all duration-300"
      >
        {/* Header with gradient */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-white/50">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10" />
          <div className="relative flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Per Person</h3>
          </div>
        </div>

        {/* Person list */}
        <div className="p-6 space-y-3 bg-gradient-to-r from-black/10 to-gray-50/50">
          {people.map((person, i) => {
            const amount = perPerson.totals[person];
            const percentage = perPerson.grand > 0 ? (amount / perPerson.grand) * 100 : 0;
            
            return (
              <motion.div
                key={person}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-white/50 to-gray-50/50 border border-white/50 p-4 hover:shadow-lg transition-all duration-300"
              >
                {/* Progress bar background */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-100/100 to-red-100/100"
                    initial={{ width: "0%" }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.7 + i * 0.1, ease: "easeOut" }}
                  />
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-200 to-red-200 flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-orange-700">
                        {person.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{person}</div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      ${amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {items.filter(item => item.people.includes(person) || item.people.length === 0).length} items
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {people.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="font-medium">No people added yet</div>
              <div className="text-sm">Add people to see the split</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex gap-3"
      >
    
      </motion.div>
    </div>
  );
}