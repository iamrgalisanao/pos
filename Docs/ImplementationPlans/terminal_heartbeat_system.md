# Terminal ID Registration & Heartbeat Implementation Plan

Assign a unique, persistent identity to each POS terminal for auditing, security, and real-time monitoring.

## Proposed Changes

### Database

#### [NEW] `terminals` table
```sql
CREATE TABLE terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    store_id UUID NOT NULL,
    name VARCHAR(255), -- User-friendly name (e.g., "Main Counter 1")
    browser_fingerprint TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

---

### Backend (Node.js/Express)

#### [NEW] `terminalController.ts`
- `registerTerminal`: Accepts `tenant_id`, `store_id`, and `name`. Returns a unique `terminal_id`.
- `terminalHeartbeat`: Updates `last_seen_at` for a given `terminal_id`.

#### [MODIFY] `index.ts`
- Register routes:
    - `POST /api/terminals/register`
    - `POST /api/terminals/:id/heartbeat`

---

### Dashboard (Next.js)

#### [NEW] `lib/terminal.ts`
- Logic to generate/retrieve a persistent client-side ID (stored in `localStorage`).
- Function to register with the backend if no ID exists.
- `startHeartbeat` utility.

#### [MODIFY] `terminal/page.tsx`
- Ensure the terminal is registered on mount.
- Send the `terminal_id` with checkout requests for auditing.

## Verification Plan

### Automated Tests
- Test registration endpoint with valid/invalid tenant/store IDs.
- Verify heartbeat updates the timestamp in the DB.

### Manual Verification
- Check the `terminals` table after opening the POS for the first time on a new browser.
- Verify that a second opening uses the same ID.
- Verify that closing the app stops heartbeats and opening it resumes them.
