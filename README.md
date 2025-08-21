# 🧾 SnapSplit AI 
Bill splitting that actually feels premium. ✨
Snap a receipt. Let AI do the heavy lifting. 
No more "who had the fries?" debates.

## ✨ What it does (in one line)

Turns a messy receipt photo into a validated JSON bill, lets you assign items by tap, and outputs per-person totals with tax & tip distributed proportionally.

### 🎥 Demo Videos

Meet SnapSplit AI, a modern bill-splitting app that turns receipt photos into fair, per-person totals in seconds. Upload a receipt, watch AI extract items, then tap to assign who had what. Taxes and tips are calculated automatically. Built with OpenAI Vision + Backblaze B2. Privacy-first. No accounts needed.

https://github.com/user-attachments/assets/6f3229ef-c53e-4314-bdbf-31d207d31a7d

https://github.com/user-attachments/assets/2eccfcce-d484-4e4d-8fd2-26ffd173fa98


## 💻 Features 

- **Vision-to-JSON with contract enforcement**  
  OpenAI Vision returns structured output (`json_object` via Responses/Chat). The server runs a **strict Zod schema** over the response, so UI only sees valid, typed data. Output cleaning tolerates code fences & double encoding.

- **Deterministic split math**  
  Items are `{name, qty, price}` and can be assigned to any subset of people. **Tax & tip are allocated proportionally** to each person’s pre‑tax share. Rounding is deferred until display to minimize drift.

- **Zero‑CORS, private uploads**  
  Files upload **server‑side** to **Backblaze B2 (S3‑compatible)** using AWS SDK v3 with `forcePathStyle` + region endpoint. Bucket stays **private**; a Next.js route **streams** bytes to the browser/model (no public URLs, no ACLs).

- **Resilient I/O & error surfaces**  
  Image fetches time out with abort signals; content type preserved. API routes perform **env guards** and return actionable errors (not generic 500s).

- **Premium UX without heavy JS**  
  Next.js App Router + RSC, Tailwind design system, **Framer Motion** for micro‑interactions, GPU‑friendly gradients, KBD accessibility. Looks “native”, stays snappy.

- **Deployable today**  
  Runs anywhere Node 18+ lives (Vercel, AWS, etc.). Minimal vendor lock‑in: OpenAI for Vision, B2 for storage; swap either behind thin adapters.

---

## ⚙️ Tech Stack

- **Web**: Next.js **15.5** (App Router, RSC), React **18**, TypeScript **5**  
- **Styling**: Tailwind **3.4** + PostCSS (**CommonJS config**), Lucide icons, Framer Motion **11**  
- **AI**: OpenAI Node SDK **4.x** (Vision via Responses/Chat; structured JSON output) + **Zod 3** for schema validation  
- **Storage**: Backblaze **B2** (S3‑compatible) via **AWS SDK v3** (`S3Client`, `PutObjectCommand`, `GetObjectCommand`), **path‑style** addressing, private bucket  
- **Runtime**: Node **18+**, ES Modules; `next.config.mjs`; `tsconfig` path aliases (`@/*`)

---

## How It Works (brief)

```
Client
 ├─ /api/storage/upload  → server uploads to B2 (private, no CORS)
 ├─ /api/s3/get          → stream private bytes to UI/model
 └─ /api/extract         → Vision → structured JSON → Zod → totals
```

**Splitting math**: per‑item cost split evenly among assignees; unassigned items default to “shared by all”. Tax/tip computed from item subtotal and distributed by **proportional weighting**.

---

## Setup

```bash
npm i
cp .env.example .env   # add your OPENAI + B2 keys
npm run dev            # http://localhost:3000
```

**.env**

```ini
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_REGION=us-east-005
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
S3_BUCKET=splitbills

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Troubleshooting

- **Region is missing** → verify all B2 vars in `.env` and restart `npm run dev`.
- **JSON parse error** → keep the safer JSON parser in `app/api/extract/route.ts` (handles code fences & double encoding).
- **Favicon 404** → add `app/icon.png` or `public/favicon.ico`.
