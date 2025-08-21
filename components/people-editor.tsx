'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, UserPlus } from 'lucide-react';

export default function PeopleEditor({ 
  people, 
  setPeople 
}: { 
  people: string[]; 
  setPeople: (p: string[]) => void; 
}) {
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  function add() {
    const v = value.trim();
    if (!v || people.includes(v)) return;
    setPeople([...people, v]);
    setValue('');
    setIsAdding(false);
  }

  function remove(name: string) {
    setPeople(people.filter(p => p !== name));
  }

  const personColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600', 
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-red-500 to-red-600'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg"
    >
      {/* Header */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-white/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">People</h3>
              <div className="text-xs text-gray-600">
                {people.length} {people.length === 1 ? 'person' : 'people'} splitting the bill
              </div>
            </div>
          </div>
          
          <motion.button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Add Person
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Add person input */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                <div className="flex-1">
                  <input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="Enter person's name (e.g. Sarah)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter') add();
                      if (e.key === 'Escape') {
                        setIsAdding(false);
                        setValue('');
                      }
                    }}
                    autoFocus
                  />
                </div>
                <motion.button
                  onClick={add}
                  disabled={!value.trim() || people.includes(value.trim())}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsAdding(false);
                    setValue('');
                  }}
                  className="px-4 py-3 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* People list */}
        <div className="space-y-3">
          <AnimatePresence>
            {people.map((person, i) => (
              <motion.div
                key={person}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/50 to-gray-50/30 border border-white/50 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${personColors[i % personColors.length]} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-lg">
                      {person.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-gray-800">{person}</div>
                    <div className="text-sm text-gray-500">
                      {person === 'You' ? 'That\'s you!' : 'Splitting the bill'}
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={() => remove(person)}
                  className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={person === 'You'} // Prevent removing "You"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {people.length === 1 && people[0] === 'You' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <div className="text-gray-500 mb-2">Just you so far!</div>
            <div className="text-sm text-gray-400">Add friends to split the bill</div>
          </motion.div>
        )}

        {/* Quick add suggestions */}
        {!isAdding && (
          <div className="flex flex-wrap gap-2">
            {['Alex', 'Sam', 'Jordan', 'Casey'].filter(name => !people.includes(name)).slice(0, 3).map(name => (
              <motion.button
                key={name}
                onClick={() => setPeople([...people, name])}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-sm hover:from-blue-100 hover:to-purple-100 hover:text-blue-700 transition-all duration-200 border border-gray-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + {name}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}