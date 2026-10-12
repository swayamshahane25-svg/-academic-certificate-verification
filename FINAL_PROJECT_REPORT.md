CertiChain — Final Project Report

Date: 12 October 2026

1. PROJECT STATUS

Overall: Demo-ready for a local presentation. Core flows (issue → verify → revoke) work end-to-end against a local Hardhat node. Frontend builds for production. AI analysis is optional and uses a safe fallback when disabled.

What works (tested):
- Backend startup and API endpoints (local)
- Frontend dev server and production build
- Hardhat local node connectivity
- Smart contract tests (local Hardhat)
- Certificate issuance (blockchain tx + DB record)
- Certificate verification (blockchain-backed lookup)
- Certificate revocation
- AI analyzer fallback when no API key
- Authentication using seeded admin

Partially / not tested:
- AI provider integration (requires API key) — NOT TESTED
- QR code scan → verify end-to-end — NOT TESTED
- Public deployment integration (Vercel frontend → public backend) — NOT TESTED


2. CHANGES MADE

Files created/modified:
- backend/services/certificateParser.js — fixed pdf-parse usage (returns parsed.text).
- blockchain/hardhat.config.ts — added `hardhat` network entry to allow tests.
- blockchain/test/Counter.ts — adjusted tests to match `CertificateRegistry.sol` signature and return tuple order.
- README.md — appended exact local-start and demo instructions.
- scripts/start-dev.sh — new helper script to start Hardhat, backend, and frontend safely.
- .env (local edit only) — added entries locally to allow demo startup; do NOT commit.

Notes: tests were updated but the smart contract source was not changed.


3. TEST RESULTS

- Frontend production build: PASS (`cd frontend && npm run build`)
- Backend startup & API: PASS (manual) (`node backend/server.js`)
- Smart contract tests: PASS (`cd blockchain && npx hardhat test --network hardhat`) — 6 passing (3 solidity, 3 mocha)
- Certificate issuance & verification: PASS (manual via API/UI)
- Certificate revocation: PASS (manual via API/UI)
- QR code verification: NOT TESTED
- AI fraud detection: FALLBACK PASS (fallback response tested). External AI: NOT TESTED
- Authentication & role permissions: PASS (seed admin login tested)

Failures observed during work and fixes applied:
- Initial Hardhat tests failed due to missing `hardhat` network and ABI mismatch in tests; both were fixed.


4. HOW TO RUN THE PROJECT (exact commands)

Recommended helper (single terminal):

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

Manual (three terminals):

Terminal A — Hardhat node:
```bash
cd ~/academic-certificate-verification/blockchain
npx hardhat node
# RPC: http://127.0.0.1:8545
```

Terminal B — Backend:
```bash
cd ~/academic-certificate-verification/backend
npm install   # one-time
node server.js
# API: http://127.0.0.1:5050
```

Terminal C — Frontend:
```bash
cd ~/academic-certificate-verification/frontend
npm install   # one-time
npm run dev -- --host
# Frontend: http://127.0.0.1:5173
```

Environment variable NAMES (do NOT commit values): CONTRACT_ADDRESS, BLOCKCHAIN_RPC_URL, PRIVATE_KEY, PORT, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, AI_* (optional)


5. PRESENTATION DEMO STEPS (tested flows only)

1. Start services (`./scripts/start-dev.sh`).
2. Open frontend at http://127.0.0.1:5173.
3. Login (admin@certichain.local / Admin123!).
4. Issue certificate: Issue Certificate page -> fill `DEMO-001`, student details, hash or upload PDF -> Issue -> show tx hash.
5. Verify certificate: Verify page -> enter `DEMO-001` + same hash (or upload same PDF) -> show valid + metadata.
6. Tamper detection: Fraud Detection -> upload altered PDF or wrong hash -> show mismatches / risk level (rule-based fallback).
7. Revoke certificate: Revoke page -> enter `DEMO-001` -> Revoke -> show tx hash; re-verify to show `revoked: true`.


6. PROJECT ARCHITECTURE (brief)

- Frontend: React + Vite; communicates with backend API.
- Backend: Node.js + Express; routes include auth, certificate issuance/lookup/revoke, fraud analysis; uses `ethers` to interact with smart contract and `sqlite3` for app data.
- Database: SQLite (`backend/data/certichain.db`) stores users, certificate_records, fraud_reports.
- Smart contract: `CertificateRegistry.sol` stores certificate metadata and cryptographic hash; supports issue, verify, revoke.
- Certificate hashing: Backend computes SHA-256 of PDF buffer and compares to contract-stored hash.
- QR: Frontend can generate QR links to verification pages; scan flow not tested.
- AI fraud detection: Optional; when enabled calls configured AI provider; otherwise uses deterministic rule-based analyzer.


7. SECURITY CHECK

Remaining issues:
- Seeded admin credentials & default JWT secret are insecure — rotate before public exposure.
- CORS is permissive for local dev — lock to allowed origins for production.
- Ensure `.env` is in `.gitignore` (it is) and do not commit secrets.

I did not print or commit any secret values.


8. DEPLOYMENT STATUS

- Public frontend exists (Vercel) but I did not test or wire it to a public backend. Public functionality needs a reachable backend and deployed contract on a public network.
- Local demo is fully functional as described above.


9. REMAINING WORK

- Add and test QR scan → verify flow end-to-end.
- Enable and test AI provider integration with a valid key (careful with usage/quota).
- Harden production configs (CORS, JWT secret rotation, remove seeded credentials or secure them).
- Optional: add `scripts/demo-issue.sh` to automate a demo sequence.


10. GITHUB CHECKPOINT

Recommended commits (safe):
- `backend/services/certificateParser.js`
- `blockchain/hardhat.config.ts`
- `blockchain/test/Counter.ts`
- `README.md`
- `scripts/start-dev.sh`

Do NOT commit any `.env` files or secrets.


--

For sharing with another GPT or reviewer, use this file in the repo:
[FINAL_PROJECT_REPORT.md](FINAL_PROJECT_REPORT.md)

If you want, I can now add the `scripts/demo-issue.sh` program to automate issue->verify->revoke for your timed demo. Let me know.
