# Royal Law College Notes — AI Answers Backend

This project changes the website's AI form so answers appear **inside the same page**. It uses a server-side OpenAI API call.

## Important limitations

- The API key must be added privately to the server environment. Never put it in `public/index.html`, any browser JavaScript, or a public repository.
- The app answers from the selected subject and general model knowledge. It is **not yet connected to the PDFs/notes as a searchable knowledge base**. Do not claim that answers are quoted from college notes until the notes are added through a retrieval/file-search workflow.
- API usage can cost money. Set usage limits/budget alerts in your API account and monitor usage.
- Legal answers are for study support, not a substitute for checking current legislation, cases, or your lecturer's materials.

## Run locally

1. Install Node.js 20 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Edit `.env` and replace `put_your_secret_key_here` with your secret API key. Do not share this file.
6. Run `npm start`.
7. Open `http://localhost:3000` in a browser. Do not open `public/index.html` directly as a file; the form needs the server.

## Deploy

Deploy this folder to a Node.js host that supports environment variables (for example, Render, Railway, or a VPS).

- Build/install command: `npm install`
- Start command: `npm start`
- Add `OPENAI_API_KEY` as a secret environment variable in the hosting dashboard.
- Optionally set `OPENAI_MODEL` to a model enabled for your API project.
- Do not upload `.env` or publish your API key.
- Keep the website and `/api/ask` on the same origin unless you intentionally configure and secure cross-origin access.
- Test `https://YOUR-DOMAIN/api/health` after deployment. It reports whether a key is configured, never the key itself.

## Security included

- API key remains on the server.
- Request body limited to 12 KB; question limited to 4,000 characters.
- Subject allowlist.
- Per-IP rate limit on the AI endpoint.
- Basic security headers via Helmet.
- No API key or raw server error is sent to the browser.

## Notes PDFs

The HTML currently references `What is Law of Torts.pdf`, `Types of Torts.pdf`, and `Tort and Crime.pdf`. Put the actual PDFs in `public/` to make those links work. The PDFs are not included in this package because they were not present among the available files when this package was generated. This version does not send those PDFs to the AI.
