#SnapSplit AI

- Next 15.5 
- PostCSS config is CommonJS (`postcss.config.cjs`) to avoid ESM errors
- Path aliases configured for `@/...`
- Backblaze B2 with server-side uploads

## Run
```bash
npm i
cp .env.example .env
# add your OPENAI_API_KEY and B2 keys
npm run dev
```
