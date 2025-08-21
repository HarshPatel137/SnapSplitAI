# SnapSplit AI 
Bill splitting that actually feels premium. ✨
Snap a receipt. Let AI do the heavy lifting. 
No more "who had the fries?" debates.

- Next 15.5 
- PostCSS config is CommonJS (`postcss.config.cjs`) to avoid ESM errors
- Path aliases configured for `@/...`
- Backblaze B2 with server-side uploads

### 🎥 Demo Videos

Meet SnapSplit AI—a modern bill-splitting app that turns receipt photos into fair, per-person totals in seconds. Upload a receipt, watch AI extract items, then tap to assign who had what. Taxes and tips are calculated automatically. Built with OpenAI Vision + Backblaze B2. Privacy-first. No accounts needed.

https://github.com/user-attachments/assets/6f3229ef-c53e-4314-bdbf-31d207d31a7d

https://github.com/user-attachments/assets/2eccfcce-d484-4e4d-8fd2-26ffd173fa98

## Run
```bash
npm i
cp .env.example .env
# add your OPENAI_API_KEY and B2 keys
npm run dev
```
