# Repository Guidelines

## Purpose
This repo hosts a simple Copa BRASA leaderboard: a static page that renders four Donorbox campaigns and a serverless endpoint that fetches, filters, sorts, and caches totals from Donorbox.

## Project Structure & Module Organization
- `frontend/` (static assets): HTML/CSS/JS for the four-bar leaderboard and auto-refresh logic.
- `api/` or `netlify/functions/`: serverless handler that calls Donorbox `/api/v1/campaigns`, filters the four target campaigns, sorts by `total_raised`, and caches results in memory for ~30–60s.
- `public/`: shared assets (favicon, logo), if needed.
- `tests/`: automated tests for the API and client rendering helpers.

## Build, Test, and Development Commands
- `npm install` (or `pnpm install`): install dependencies.
- `npm run dev`: run the static frontend locally and the serverless stub if supported by the chosen framework (e.g., Vite + Netlify/Vercel dev server).
- `npm run build`: produce the static bundle for deployment.
- `npm run lint` / `npm run format`: check and apply style rules if configured.
- `npm run test`: execute the test suite.

## Coding Style & Naming Conventions
- Use 2-space indentation and trailing commas where supported.
- Prefer TypeScript for new modules; name serverless functions `campaigns.ts` or `campaigns.js`.
- Keep functions small; extract shared helpers into `frontend/lib/` or `api/lib/`.
- Format code before commits (Prettier/ESLint if configured); keep imports sorted.

## Testing Guidelines
- Use a lightweight runner (e.g., Vitest/Jest) for API helpers and any client-side utilities.
- Name tests `*.test.ts` and mirror source structure under `tests/` or alongside modules.
- Add coverage for sorting, filtering by campaign IDs, cache TTL logic, and formatting of totals.

## Commit & Pull Request Guidelines
- Follow concise, imperative commit messages (`Add cache layer`, `Render rankings`).
- For PRs, include: purpose, key changes, tests executed, and any deployment notes (e.g., required env vars `DONORBOX_API_KEY`).
- Add screenshots or short GIFs for UI tweaks; link to related issues/tasks when available.

## Security & Configuration
- Keep secrets in environment variables; never commit keys. For local dev, use `.env.local` (gitignored).
- Cache remains in-memory only; avoid introducing external state stores unless required.
- Document required environment variables in the PR description or README updates.

## Donorbox API description:
Get all campaigns:
{GET} /api/v1/campaigns
Output:
[
  {
    "id":1,
    "name":"Donorbox New Campaign",
    "slug":"donorbox-new-campaign",
    "currency":"usd",
    "created_at":"2017-10-20T22:30:55.620Z",
    "updated_at":"2017-10-20T22:30:55.620Z",
    "goal_amt":"10000.0",
    "formatted_goal_amount":"$1,0000",
    "total_raised":"2000.0",
    "formatted_total_raised":"$2000",
    "donations_count":66
  }
]

Get all donations:
{GET} /api/v1/donations
Output:
[
    {
        "action": "new",
        "campaign": {
            "id": 1,
            "name": "Donorbox Campaign"
        },
        "donor": {
            "id": 59,
            "name": "John Doe",
            "first_name": "John",
            "last_name": "Doe",
            "email": "johndoeemail@hotmail.com",
            "address":"123 6th St.",
            "address_line_2":"Lakeside Road",
            "city":"Melbourne",
            "state":"FL",
            "zip_code": "32904",
            "country":"US",
            "employer":null,
            "occupation":null
        },
        "amount": "100.0",
        "formatted_amount": "$100",
        "converted_amount": "100.0",
        "formatted_converted_amount": "$100",
        "recurring": false,
        "first_recurring_donation": false,
        "amount_refunded": "0.0",
        "formatted_amount_refunded": "$0",
        "stripe_charge_id": "ch_1BF94aBku99FiTp3uJM5mSKw",
        "id": 1,
        "status": "paid",
        "donation_type": "stripe",
        "donation_date": "2017-12-21T17:54:13.432Z",
        "anonymous_donation": false,
        "gift_aid": false,
        "designation": "Designed Cause",
        "join_mailing_list": false,
        "comment": "thanks",
        "donating_company": null,
        "currency": "USD",
        "converted_currency": "USD",
        "utm_campaign": "google_ads",
        "utm_source": "Adwords",
        "utm_medium": "cpc",
        "utm_term": "nonprofit fundraising",
        "utm_content": "np1",
        "processing_fee": 0.59,
        "formatted_processing_fee": "$0.59",
        "address": "123 6th St.",
        "address_line_2": "Lakeside Road",
        "city": "Melbourne",
        "state": "FL",
        "zip_code": "32904",
        "country": "US",
        "employer": null,
        "occupation": null,
        "questions": [
            {
              "question_type": "radiobutton",
              "question": "Would you like to volunteer?",
              "answer": "Yes"
            },
            {
              "question_type": "text",
              "question": "Why are you donating",
              "answer": "I would like to help"
             },
             {
              "question_type": "check",
              "question": "First/Last Name is correct?",
              "answer": true
             },
             {
              "question_type": "dropdown",
              "question": "Would you like to showcase your donation",
              "answer": "Yes"
             }
        ]
    }
]