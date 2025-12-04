# Copa BRASA Leaderboard (Local Dev)

Quick start for running the static leaderboard and serverless API locally.

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

## Notes
- Uses Node 18+ native `fetch`.  
- CORS is open (`*`) for easier embedding during demos.  
- Backend aggregates chapter totals from the mandatory dropdown question on each donation for the specified campaigns.
