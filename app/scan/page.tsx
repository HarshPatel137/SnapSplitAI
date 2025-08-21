'use client';
import { useState } from 'react';
import { motion } from "motion/react"
import UploadCard from '@/components/upload-card';
import ItemsTable, { type Item } from '@/components/items-table';
import PeopleEditor from '@/components/people-editor';
import Summary from '@/components/summary';

type ExtractResponse = {
  merchant?: string;
  date?: string;
  currency?: string;
  items: { name: string; qty: number; price: number }[];
  taxPct?: number;
  tipPct?: number;
};

interface UploadResult {
  publicUrl: string;
  key: string;
}

export default function ScanPage() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [people, setPeople] = useState<string[]>(['You']);
  const [taxPct, setTaxPct] = useState(0.13);
  const [tipPct, setTipPct] = useState(0.18);
  const [meta, setMeta] = useState<{merchant?:string; date?:string, currency?:string}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runExtraction(result: UploadResult) {
    setLoading(true); 
    setError(null);
    
    try {
      console.log('Starting extraction with key:', result.key);
      
      const res = await fetch('/api/extract', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: result.key, // Use direct B2 key
          imageUrl: result.publicUrl // Keep as fallback
        }) 
      });
      
      const responseData = await res.json();
      
      if (!res.ok || responseData.error) {
        throw new Error(responseData.error || 'Extraction failed');
      }
      
      const data = responseData.data as ExtractResponse;
      console.log('Extraction successful:', data);
      
      setMeta({ merchant: data.merchant, date: data.date, currency: data.currency });
      setTaxPct(data.taxPct ?? 0.13);
      setTipPct(data.tipPct ?? 0.18);
      setItems(data.items.map((it, idx) => ({ 
        id: String(idx+1), 
        name: it.name, 
        qty: it.qty, 
        price: it.price, 
        people: [] 
      })));
    } catch (e: any) { 
      console.error('Extraction error:', e);
      setError(e?.message ?? 'Extraction failed'); 
    } finally { 
      setLoading(false); 
    }
  }

  function handleUploadComplete(result: UploadResult) {
    console.log('Upload complete:', result);
    setUploadResult(result);
    runExtraction(result);
  }

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
        
        <div>
          <h1 className="text-2xl font-bold">Scan Receipt</h1>
          <p className="text-neutral-600">Take a photo or upload an image of your receipt</p>
        </div>
        
        <UploadCard onUploaded={handleUploadComplete} />
        
        {loading && <div className="text-sm text-neutral-600">Analyzing receipt…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {items.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{meta.merchant ?? 'Your receipt'}</div>
                    <div className="text-xs text-white">{meta.date}</div>
                  </div>
                  {uploadResult?.publicUrl && (
                    <a className="text-xs text-brand-600 underline" href={uploadResult.publicUrl} target="_blank">
                      View Image
                    </a>
                  )}
                </div>
                <ItemsTable items={items} setItems={setItems} people={people} />
              </div>
              <div className="card grid grid-cols-3 gap-3">
                <label className="text-sm">
                  <div className="text-white font-bold text-sm">Tax %</div>
                  <input 
                    type="number" 
                    value={(taxPct*100)} 
                    onChange={e => setTaxPct(Number(e.target.value)/100)} 
                    className="w-full rounded-xl border px-3 py-2" 
                  />
                </label>
                <label className="text-sm">
                  <div className="text-white font-bold text-sm">Tip %</div>
                  <input 
                    type="number" 
                    value={(tipPct*100).toFixed(0)} 
                    onChange={e => setTipPct(Number(e.target.value)/100)} 
                    className="w-full rounded-xl border px-3 py-2" 
                  />
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <PeopleEditor people={people} setPeople={setPeople} />
              <Summary items={items} people={people} subtotal={0} tipPct={tipPct} taxPct={taxPct} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}