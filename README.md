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
