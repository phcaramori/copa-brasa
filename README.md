# Placar Copa BRASA

## Setup
1) Copy `.env.example` to `.env` and fill values:  
   - `DONORBOX_LOGIN_EMAIL`: Donorbox org login email (Basic auth username).  
   - `DONORBOX_API_KEY`: Donorbox API key (Basic auth password).  
   - `DONORBOX_CAMPAIGN_IDS`: Comma-separated list of four campaign IDs (order matches fixed team names).  
2) Install deps: `npm install`

## Run locally
```bash
npm run dev
# open http://localhost:4173
```
This serves `frontend/index.html` and mounts the API at `/api/campaigns`.