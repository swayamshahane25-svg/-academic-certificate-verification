# CertiChain

CertiChain is a full-stack academic certificate verification system built with React, Express, SQLite, JWT authentication, and a Hardhat-backed Ethereum smart contract for certificate verification metadata.

## Authentication Architecture

The application uses SQLite for local development identity storage and JWT tokens for session-based authentication. The blockchain remains authoritative for certificate verification, while the database handles application users, roles, permissions, and metadata.

### Roles
- ADMIN
- ISSUER
- STUDENT
- PUBLIC (no login required for verification)

### Role Permissions
| Feature | Admin | Issuer | Student | Public |
| --- | --- | --- | --- | --- |
| Verify Certificate | ✓ | ✓ | ✓ | ✓ |
| Issue Certificate | ✓ | ✓ | ✗ | ✗ |
| Revoke Certificate | ✓ | ✓ | ✗ | ✗ |
| View All Certificates | ✓ | ✓* | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| Fraud Analysis | ✓ | ✓ | limited | ✗ |

* subject to issuer ownership rules.

### Authentication Flow
1. User provides email and password.
2. Backend validates credentials using bcrypt-based password hashing.
3. Backend issues a signed JWT token.
4. Frontend stores the token in localStorage.
5. Protected routes include the bearer token in API requests.
6. Backend middleware validates the token and role before allowing access.

### Authorization Flow
1. Request reaches Express route.
2. `authenticateUser` validates JWT.
3. `requireRole` checks the caller's role.
4. If unauthorized, the API returns a 401/403 error.
5. Frontend redirects to `/login` or `/access-denied`.

### Database Schema
- `users`: id, name, email, passwordHash, role, university, status, createdAt, updatedAt
- `certificate_records`: certificate metadata linked to users or issuers
- `fraud_reports`: fraud-analysis metadata and summaries

### Security Considerations
- Passwords are hashed with bcrypt before storage.
- No plaintext passwords are returned from the API.
- Private keys and AI API keys remain server-side only.
- Login requests are rate limited.
- CORS is enabled for the local dev environment but only on the application layer.
- Sensitive internal errors are not returned to clients.

## Local Setup

1. Start the Hardhat blockchain in `blockchain/`.
2. Deploy the smart contract if needed.
3. Configure `backend/.env` from `backend/.env.example`.
4. Start `backend/server.js`.
5. Start the React frontend.

## Default admin account

The backend seeds a local admin account automatically:
- Email: `admin@certichain.local`
- Password: `Admin123!`

Change this before production use.

## Quick Local Demo (commands I used)

WARNING: Do not commit any `.env` files or secrets to source control.

1) Ensure `node` and `npm` are installed.

2) Recommended: use the helper script to start everything (Hardhat, backend, frontend):

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

The script will:
- Start a local Hardhat node on `http://127.0.0.1:8545` if it is not already running.
- Start the backend on `http://127.0.0.1:5050` (reads `backend/.env` or root `.env`).
- Start the frontend dev server on `http://127.0.0.1:5173`.

3) Manual start (if you prefer separate terminals):

Hardhat node (only if not already running):
```bash
cd blockchain
npx hardhat node
```

Backend (in a separate terminal):
```bash
cd backend
# install once: npm install
node server.js
```

Frontend (in a separate terminal):
```bash
cd frontend
# install once: npm install
npm run dev -- --host
```

4) Required environment variable NAMES (do NOT put secrets here):
- `CONTRACT_ADDRESS` (smart contract address used by backend)
- `BLOCKCHAIN_RPC_URL` (e.g. `http://127.0.0.1:8545`)
- `PRIVATE_KEY` (local dev private key used by backend signer)
- `PORT` (backend port, default `5050`)
- `JWT_SECRET` (backend JWT signing secret)
- `ADMIN_EMAIL` (seed admin email)
- `ADMIN_PASSWORD` (seed admin password)
- AI-related (optional): `AI_ENABLED`, `AI_PROVIDER`, `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL`

5) Demo accounts and quick actions
- Admin (seeded): `admin@certichain.local` / `Admin123!`

Demo flow (what I ran and validated):
- Login as admin at the frontend login page.
- Issue a certificate via the Issue Certificate UI (or POST to `/api/certificate/issue`).
- Verify the certificate via Verify page or `GET /api/certificate/lookup/:id`.
- Revoke the certificate via Revoke UI (or POST to `/api/certificate/revoke`).
- Run fraud analysis by uploading a PDF on Fraud Detection page. If AI is not configured the server will use the rule-based fallback and return structured findings.

6) What I tested and fixed for the demo
- Fixed PDF parsing bug in `backend/services/certificateParser.js` (now uses `pdf-parse` correctly).
- Ensured local `.env` values are present so the backend starts locally.
- Ran and fixed blockchain tests so they pass locally (`blockchain/test/Counter.ts`).
- Added a `scripts/start-dev.sh` helper to start services for the demo.

7) Known limitations / open items
- AI provider is optional and disabled by default for local demos; to enable AI you must set `AI_API_KEY` and related env vars.
- The project seeds a local admin account automatically — this is convenient for demos but insecure for production.
- CORS is permissive for local development; lock it down for production.
- No automated integration tests exercise the full end-to-end frontend flows—manual demo steps are recommended.

If you want, I can also add a short `scripts/demo-issue.sh` to programmatically issue and verify a certificate for the live demo.
