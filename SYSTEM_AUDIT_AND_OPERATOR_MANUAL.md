# The Boma Café — Full System Audit & Operator Manual

**Date:** 15 June 2026  
**Repository:** `malikstopher-dev/the-boma-cafe`  
**Platform:** Next.js 14.2.3 on Vercel (serverless)  
**Database:** Supabase PostgreSQL + Local SQLite (CMS)  
**Auth:** Custom cookie-based (password-gated roles)

---

## 1. System Architecture Overview

```
┌─────────────────────┐      ┌──────────────────────┐
│    Customer Web     │      │   Admin / Staff Web   │
│  (menu, contact,    │      │  (admin/*, /kitchen,  │
│   track-order)      │      │   /waiter, /receipt)  │
└────────┬────────────┘      └──────────┬───────────┘
         │                              │
         ▼                              ▼
┌──────────────────────────────────────────────┐
│           Next.js 14 (Vercel Serverless)      │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │API Routes│  │  Pages   │  │ Middleware  │  │
│  │ (route.ts)│  │(page.tsx)│  │  (edge)    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │          │
│       ▼              ▼              ▼          │
│  ┌──────────────────────────────────────┐      │
│  │         Service Layer                │      │
│  │  lib/orderService, lib/order-        │      │
│  │  state-machine, lib/pos/*,           │      │
│  │  lib/auth, lib/rate-limit            │      │
│  └──────────────┬───────────────────────┘      │
│                 │                               │
└─────────────────┼───────────────────────────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│Supabase │ │ SQLite  │ │Filesystem│
│Postgres │ │ cms.db  │ │ uploads/ │
│(orders, │ │(menu,   │ │ gallery/ │
│bookings,│ │events,  │ │          │
│contact, │ │promos,  │ │          │
│waiters) │ │CMS,etc) │ │          │
└─────────┘ └─────────┘ └──────────┘
```

### Key Design Decisions

- **Orders use Supabase** (persists on Vercel, realtime capable)
- **CMS content uses SQLite** (menu items, events, promotions, settings, gallery metadata — stored in `data/cms.db` in the project directory)
- **Auth is custom cookie-based**, not Supabase Auth (passwords stored as env vars, SHA-256 hashed cookie)
- **Offline queue** for order creation retries with backoff
- **Rate limiting** is in-memory (resets per serverless instance)

### Storage Systems

| System | Used For | Persists on Vercel? | Realtime? |
|--------|----------|---------------------|-----------|
| Supabase (PostgreSQL) | orders, bookings, contact_messages, order_events, waiters | ✅ Yes | ✅ Yes (orders, order_events, waiters) |
| SQLite (cms.db) | menu, events, promotions, CMS settings, gallery metadata, announcements, popups | ❌ No — project dir is read-only on Vercel | ❌ No |
| Filesystem (public/uploads/) | menu images, gallery images | ❌ No — ephemeral storage | ❌ No |

**⚠️ Critical Limitation:** SQLite CMS content and uploaded images do NOT persist across Vercel deployments. Data written via admin pages (menu items, events, promotions) is lost on redeploy. This is a known architectural issue — the CMS should ideally use Supabase or a blob store (R2/S3) for persistence.

---

## 2. Admin Audit

### 2.1 Admin Index (`/admin`)
- **Purpose:** Redirects to `/admin/dashboard`
- **Auth:** Cookie-based (middleware + layout AuthProvider)
- **Actions:** None — pure redirect

### 2.2 Admin Dashboard (`/admin/dashboard`)

| Item | Detail |
|------|--------|
| **Purpose** | Overview of site stats (menu items, events, promotions, inquiries count) + "Orders By Waiter" section + quick actions |
| **Data Source** | SQLite (cmsService.get*) for CMS stats; Supabase (`/api/supabase/orders?waiter_stats=true`) for waiter orders |
| **Actions** | Quick action links to menu, events, promotions, popup management |
| **Permissions** | Admin only (middleware + layout) |
| **Back Button** | ✅ Yes — returns to previous page |

**What can be edited/deleted:** Nothing directly on this page. It's read-only.

### 2.3 Admin Orders (`/admin/orders`)

| Item | Detail |
|------|--------|
| **Purpose** | Full restaurant POS — manage all orders (pending, confirmed, preparing, ready, completed) |
| **Data Source** | Supabase `orders` table (polled every 4 seconds) |
| **Sidebar** | Table grid (tables 1-20) + order list + checkout panel |
| **Permissions** | Admin (middleware + layout) |

**Actions (OrderCard):**

| Button | Effect | Database Change |
|--------|--------|----------------|
| ✅ Accept | Move from pending → confirmed | Updates `orders.status`, inserts `order_events` row |
| 🔵 Prepare | Move to preparing | Same |
| 🟢 Ready | Move to ready | Same |
| ✅ Complete | Move to completed | Same |
| ❌ Cancel | Cancel order | Same |
| 💳 Confirm Payment | Sets `payment_status='paid'`, records `payment_confirmed_at/by` | Updates `orders.payment_status` + timestamps |

**Workflows:**
- Click table in sidebar → shows orders for that table
- Click order card → opens checkout panel on right
- Keyboard shortcut `1` = accept next pending order
- Keyboard shortcut `2`/`3`/`4` = status transitions (blocked if payment required)

**Limitations:**
- No bulk operations
- Cannot edit order items after creation
- Cannot edit totals (server-authoritative)
- Payment confirmation is manual

### 2.4 Admin Bookings (`/admin/bookings`)

| Item | Detail |
|------|--------|
| **Purpose** | View and manage table booking requests from customers |
| **Data Source** | Supabase `bookings` table |
| **Permissions** | Admin (middleware + layout) |
| **Back Button** | ✅ Yes |

**Actions:**
- View booking details (name, phone, email, date, time, guests, notes)
- Delete booking (with confirmation)
- No status update buttons visible (status column exists but no approve/cancel UI)

**Limitations:**
- Cannot change booking status (no confirm/cancel buttons)
- No calendar view
- No date filtering

### 2.5 Admin Inquiries (`/admin/inquiries`)

| Item | Detail |
|------|--------|
| **Purpose** | View contact form submissions from customers |
| **Data Source** | Supabase `contact_messages` (via `/api/supabase/contact`) |
| **Permissions** | Admin (middleware + layout) |
| **Back Button** | ✅ Yes |

**Actions:**

| Button | Effect | Database Change |
|--------|--------|----------------|
| Mark Read | Marks message as read (removes blue left border) | PATCH `contact_messages.is_read = true` |
| Delete | Removes message | DELETE from `contact_messages` |

**Features:**
- Unread messages have blue left border
- Shows subject badge (if present)
- Shows name, email, phone, message, date

### 2.6 Admin Menu (`/admin/menu`)

| Item | Detail |
|------|--------|
| **Purpose** | CRUD for menu items (food menu) |
| **Data Source** | SQLite (via cmsService) |
| **Permissions** | Admin (middleware + layout) |
| **Back Button** | ✅ Yes |

**Actions:**
- Add menu item (name, description, price, category, image, sizes, add-ons, availability)
- Edit menu item
- Delete menu item (with confirmation)
- Toggle availability
- Upload image (base64 stored in SQLite)

**⚠️ Limitation:** Images stored as base64 in SQLite → lost on Vercel redeploy. Menu items themselves also lost since SQLite is ephemeral on Vercel.

### 2.7 Admin Bar Menu (`/admin/bar-menu`)

Same structure as Admin Menu but for drinks/cocktails. Same SQLite limitations.

### 2.8 Admin Categories (`/admin/categories`)

| Item | Detail |
|------|--------|
| **Purpose** | Manage menu categories (e.g., Starters, Mains, Desserts) |
| **Data Source** | SQLite |
| **Permissions** | Admin |
| **Back Button** | ✅ Yes |

**Actions:** Add, edit, delete categories. Toggle active/inactive.

### 2.9 Admin Events (`/admin/events`)

| Item | Detail |
|------|--------|
| **Purpose** | Manage events (upcoming, past, highlighted) |
| **Data Source** | SQLite |
| **Permissions** | Admin |
| **Back Button** | ✅ Yes |

**Actions:** Add, edit, delete events. Upload images. Tabs for upcoming/past/highlighted.

**⚠️ Limitation:** Events stored in SQLite — lost on Vercel redeploy.

### 2.10 Admin Promotions (`/admin/promotions`)

Same as Events. SQLite-backed.

### 2.11 Admin Gallery (`/admin/gallery`)

| Item | Detail |
|------|--------|
| **Purpose** | Manage photo gallery (events, food, venue, people, promotions folders) |
| **Data Source** | Filesystem (public/gallery/) + SQLite metadata |
| **Permissions** | Admin |
| **Back Button** | ✅ Yes |

**Actions:** Upload images, delete images. Categorized by folder.

**⚠️ Limitation:** Images uploaded to server filesystem — lost on Vercel redeploy.

### 2.12 Admin Popup (`/admin/popup`)

| Item | Detail |
|------|--------|
| **Purpose** | Configure a promotional popup that appears on the website |
| **Data Source** | SQLite |
| **Permissions** | Admin |
| **Back Button** | ✅ Yes |

**Actions:** Edit popup content (title, description, image, CTA, enable/disable, show-once-per-session).

### 2.13 Admin Announcement (`/admin/announcement`)

| Item | Detail |
|------|--------|
| **Purpose** | Configure announcement bar at top of website |
| **Data Source** | SQLite |
| **Permissions** | Admin |
| **Back Button** | ✅ Yes |

**Actions:** Edit announcement text, link, link text, enable/disable.

### 2.14 Admin Site Settings (`/admin/site-settings`)

| Item | Detail |
|------|--------|
| **Purpose** | Configure homepage hero, experience cards, about section, contact info |
| **Data Source** | SQLite + JSON file |
| **Permissions** | Admin |
| **Back Button** | ✅ Yes |

**Actions:** Edit all site-wide settings across multiple tabs (homepage, about, contact, orders).

### 2.15 Admin Waiters (`/admin/waiters`)

| Item | Detail |
|------|--------|
| **Purpose** | Manage waiters (add, edit, toggle duty, delete) |
| **Data Source** | Supabase `waiters` table (via `/api/waiters`) |
| **Permissions** | Admin ONLY (not kitchen) |
| **Back Button** | ✅ Yes |

**Actions:**

| Button | Effect | Database Change |
|--------|--------|----------------|
| + Add | Creates new waiter | INSERT into `waiters` |
| ✏️ | Inline edit name | PATCH `waiters.name` |
| 🟢/🔴 | Toggle on/off duty | PATCH `waiters.active` |
| 🗑️ | Delete waiter (with confirmation modal) | DELETE from `waiters` |

**Features:** Search, sort (on-duty first, then alphabetical), created date display, duplicate name prevention.

### 2.16 Admin Analytics (`/admin/analytics`)

| Item | Detail |
|------|--------|
| **Purpose** | Revenue analytics, order statistics, top products |
| **Data Source** | Supabase `orders` (via `/api/admin/analytics`) |
| **Permissions** | Admin ONLY |
| **Back Button** | ✅ Yes |

**Shows:** Revenue over time, order frequency, top products by qty/revenue, order type breakdown.

### 2.17 Admin Kitcken (`/admin/kitchen`)

**See Section 4 (Kitchen Audit) below.**

---

## 3. Orders System Audit

### 3.1 How Orders Enter the System

```
Customer Website
├── /menu          → Add to cart → Checkout → POST /api/supabase/orders
├── /waiter        → Waiter creates dine-in order → POST /api/supabase/orders
├── WhatsApp       → Manual (phone/WhatsApp call, staff creates order in admin)
└── Admin POS      → Staff creates order manually in /admin/orders

All paths converge to: POST /api/supabase/orders
```

### 3.2 Order Creation Flow

```
Customer clicks "Place Order"
         │
         ▼
validateOrder() checks:
  ├── customer_name required
  ├── phone required (non-empty)
  ├── order_type must be 'pickup', 'delivery', or 'dine-in'
  ├── requested_time required
  ├── items array non-empty
  ├── each item has menu_item_id + quantity
  ├── for 'dine-in': table_number required, waiter_name required
  └── for 'delivery': delivery_address required
         │
         ▼
sanitizeOrderInput() strips unknown fields
         │
         ▼
createOrder():
  ├── Generates order_ref (BOMA-YYMMDD-NNN)
  ├── Calculates total server-side (ignores client-submitted total)
  ├── Checks idempotency_key (if provided, prevents duplicates)
  ├── Inserts into Supabase `orders` table
  ├── Logs ORDER_CREATED event in `order_events`
  └── Returns order with ref
```

### 3.3 Required vs Optional Fields

| Field | Required | Notes |
|-------|----------|-------|
| customer_name | ✅ | Trimmed, non-empty |
| phone | ✅ | Trimmed, non-empty |
| order_type | ✅ | 'pickup', 'delivery', or 'dine-in' |
| requested_time | ✅ | Free text (e.g., "ASAP", "18:30") |
| items | ✅ | Array of {menu_item_id, quantity} |
| table_number | ✅ (dine-in) | For dine-in orders |
| waiter_name | ✅ (dine-in) | For dine-in orders; stored as snapshot |
| delivery_address | ✅ (delivery) | For delivery orders |
| idempotency_key | Optional | Prevents duplicate submissions |
| notes | Optional | Per-item notes in items array |

### 3.4 Order Status Flow

```
                ┌─────────┐
                │ PENDING │
                └────┬────┘
                     │
                ┌────▼─────┐
                │ CONFIRMED │
                └────┬─────┘
                     │
                ┌────▼─────┐
                │ PREPARING │
                └────┬─────┘
                     │
                ┌────▼───┐
                │  READY  │
                └────┬───┘
                     │
                ┌────▼──────┐
                │ COMPLETED │
                └───────────┘

  Any state ──→ CANCELLED
```

**Transitions enforced by state machine** (`src/lib/order-state-machine.ts`):
- Only forward transitions allowed (pending → confirmed → preparing → ready → completed)
- Completed/cancelled orders are terminal (cannot be changed)
- Payment check: `delivery` orders must have `payment_status='paid'` before transitioning to confirmed/preparing/ready/completed

### 3.5 Payment Flow

```
Order created → payment_status = 'pending'

For DELIVERY orders:
  - Kitchen cannot accept/prepare until payment confirmed
  - Admin must click "Confirm Payment" on order card
  - Sets payment_status = 'paid', records who confirmed and when
  - Then kitchen can proceed

For PICKUP orders:
  - No payment confirmation required to proceed
  - Can be prepared while payment is pending

For DINE-IN orders:
  - No payment flow (pay at restaurant)

Refund: Admin can change payment_status to 'refunded' (no UI button yet)
```

### 3.6 Kitchen Flow

```
1. New order appears in "NEW ORDERS" column (kitchen display)
2. Staff clicks Accept (or keyboard 1)
   → Moves to "IN PREP" column
   → Status changes to 'confirmed'
3. Staff clicks Start Prep
   → Remains in "IN PREP" column
   → Status changes to 'preparing'
4. Staff clicks Ready
   → Moves to "READY" column
   → Status changes to 'ready'
   → Order auto-clears after 5 minutes
5. Admin marks as Completed from admin orders page
```

### 3.7 Tracking Flow

```
Customer enters order_ref on /track-order
         │
         ▼
GET /api/track-order?ref=XXX
         │
         ▼
Returns: order_ref, customer_name, total, status,
         payment_status, order_type, waiter_name,
         table_number, status_label, created_at
         │
         ▼
Page shows:
  - Status workflow (pending → confirmed → preparing → ready → completed)
  - Payment status section
  - Waiter/table for dine-in orders
  - Auto-polls every 10 seconds
  - Stops polling on completed/cancelled
```

---

## 4. Kitchen Audit

### 4.1 Kitchen Page (`/admin/kitchen`)

**Purpose:** Real-time kitchen display for food preparation staff

**Auth:** Client-side password gate (kitchen password) — NOT protected by middleware

**Layout:** 3-column kanban board

| Column | Statuses | Color | What Staff See |
|--------|----------|-------|----------------|
| NEW ORDERS | pending | Yellow | All new unaccepted orders |
| IN PREP | confirmed, preparing | Blue | Orders being worked on |
| READY | ready | Green | Completed orders (auto-clear after 5 min) |

### 4.2 What Kitchen Staff See (per order card)

- Order reference (e.g., BOMA-250615-001)
- Time since order placed
- Order type (pickup/delivery/dine-in)
- Payment status badge (for delivery — shows 🟠 Awaiting Payment or 🟢 Paid)
- Customer name (if provided)
- Waiter name (for dine-in — shown in red)
- Table number (for dine-in — shown in red, bold)
- Items list with quantities
- Item notes
- Order notes

### 4.3 Kitchen Actions

| Action | Trigger | Effect | Status Change |
|--------|---------|--------|---------------|
| Accept order | Button click or keyboard `1` | Moves to IN PREP | pending → confirmed |
| Start preparing | Button click or keyboard `1` | Stays in IN PREP | confirmed → preparing |
| Mark ready | Button click or keyboard `3` | Moves to READY | preparing → ready (or confirmed → ready) |
| Sound toggle | Click 🔊 button | Toggle new-order sound on/off | — |

**What kitchen CANNOT do:**
- Cannot complete orders (admin only)
- Cannot cancel orders
- Cannot edit order items
- Cannot modify prices
- Cannot process payments
- Cannot accept unpaid delivery orders (blocked)
- Cannot delete orders

### 4.4 Real-Time Updates

- **Initial load:** Fetches all orders from `/api/supabase/orders`
- **Live updates:** Supabase Realtime subscription on `orders` table (INSERT + UPDATE)
- **New order sound:** AudioContext beep (880Hz) when new pending order arrives
- **Ready chime:** Triangle wave (660Hz) when order marked ready
- **Auto-cleanup:** Orders in "READY" column are automatically removed after 5 minutes
- **Polling fallback:** Re-fetches every 30 seconds

### 4.5 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Accept next pending order / start prep |
| `2` | (reserved) |
| `3` | Mark focused order as ready |
| `Arrow` keys | Navigate between order cards |

---

## 5. Waiter Page Audit

### 5.1 Waiter Page (`/waiter`)

**Purpose:** Allow waiters to create dine-in orders from tableside

**Auth:** Client-side password gate (uses KITCHEN_PASSWORD — shared with kitchen)

### 5.2 Order Creation Flow

```
STEP 1: SELECT TABLE
  ├── Grid of tables 1-20
  └── Click table → moves to menu

STEP 2: ADD ITEMS
  ├── Category chips filter menu items
  ├── Click item to add to cart
  ├── Search bar to find items
  ├── Cart icon shows item count
  └── Click cart → moves to review

STEP 3: REVIEW & SUBMIT
  ├── Shows table number + waiter name
  ├── Shows all items with quantities
  ├── Can adjust quantities
  ├── Waiter must be selected (dropdown of active waiters)
  ├── Table number must be set
  └── Click "Send" → order submitted
```

### 5.3 Required Information

| Field | Required | Source |
|-------|----------|--------|
| Table number | ✅ | Selected from grid |
| Waiter name | ✅ | Dropdown (from `/api/waiters/active`) |
| Items | ✅ | At least 1 item in cart |
| Customer name | Auto | Set to `Table {number}` |
| Phone | Auto | Set to `'waiter-order'` |

### 5.4 After Submission

- Shows success screen with order reference
- "New Order" button resets for next order
- Order appears in kitchen display

### 5.5 Limitations

- No order editing after submission
- No ability to view past orders
- No ability to split bills
- No payment processing
- No custom customer names (always "Table X")
- No delivery or pickup — dine-in only
- Uses kitchen password (not separate waiter password)

---

## 6. Tracking Audit

### 6.1 Tracking Page (`/track-order`)

**Purpose:** Allow customers to look up order status

**Auth:** None (public)

### 6.2 How It Works

1. Customer enters their order reference (e.g., BOMA-250615-001)
2. Clicks "Track"
3. Fetches `GET /api/track-order?ref=XXX`
4. Displays status with workflow progress

### 6.3 What Customer Sees

- Order reference
- Current status with color badge
- Workflow progress (pending → confirmed → preparing → ready → completed)
- Payment status (paid/pending/refunded) with contextual message
- Customer name, total, order date
- Waiter name (for dine-in)
- Table number (for dine-in)
- Cancellation notice (if cancelled)

### 6.4 What Updates Are Real-Time

- Page auto-polls every 10 seconds
- Polling stops when order reaches completed or cancelled
- No WebSocket/Realtime — polling only

### 6.5 Rate Limiting

- 10 requests per minute per IP

---

## 7. Security Audit

### 7.1 CRITICAL Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | **Receipt page has no auth** — `getAdminClient()` with service_role key, selects ALL order data by ref. Anyone with a ref can view full order details including delivery address, phone, payment info. | 🔴 CRITICAL | Unfixed |
| 2 | **DEV mode bypasses ALL auth** — middleware skips cookie check when `NODE_ENV === 'development'` | 🔴 CRITICAL | Unfixed |
| 3 | **SQLite CMS data lost on Vercel** — all menu items, events, promotions, settings, images are stored in `data/cms.db` which is read-only on Vercel serverless. Data written via admin CMS is lost on every redeploy. | 🔴 CRITICAL | Unfixed |

### 7.2 HIGH Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 4 | Empty default passwords — env vars default to `''` if not set | 🟠 HIGH | Unfixed |
| 5 | No brute-force protection on login endpoint | 🟠 HIGH | Unfixed |
| 6 | Track-order exposes customer data publicly | 🟠 HIGH | Unfixed |
| 7 | Active waiters list has no auth | 🟠 HIGH | Unfixed |
| 8 | Kitchen page is client-side-only auth (no middleware protection) | 🟠 HIGH | Unfixed |

### 7.3 MEDIUM Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 9 | Waiter page uses kitchen password (not separate WAITER_PASSWORD) | 🟡 MEDIUM | Unfixed |
| 10 | No rate limiting on authenticated PATCH/DELETE endpoints | 🟡 MEDIUM | Unfixed |
| 11 | Rate limiting is in-memory (per-instance on Vercel) | 🟡 MEDIUM | Unfixed |
| 12 | Admin cookies valid for 7 days with no rotation/revocation | 🟡 MEDIUM | Unfixed |

### 7.4 LOW Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 13 | No CSRF protection (mitigated by sameSite cookies) | 🟢 LOW | Unfixed |
| 14 | No Content Security Policy headers | 🟢 LOW | Unfixed |
| 15 | `dangerouslySetInnerHTML` on receipt page | 🟢 LOW | Unfixed |
| 16 | No password change mechanism | 🟢 LOW | Unfixed |

### 7.5 Auth Summary

```
Authentication layers (defense in depth):

Public pages:            No auth (intentional)
Admin pages (routes):    Middleware (edge) + Layout AuthProvider (client) + API role checks
Admin pages (kitchen):   Client-side PasswordGate ONLY
Waiter page:             Client-side PasswordGate ONLY  
Receipt page:            NO AUTH
API routes (orders):     Public POST (rate-limited), Protected GET/PATCH/DELETE
API routes (admin):      Protected by requireAnyRole(['admin', 'kitchen'])
API routes (CMS):        Protected by requireAnyRole(['admin', 'kitchen'])
API routes (public):     No auth (menu, gallery, track-order, waiters/active)
```

---

## 8. Database Audit

### 8.1 Tables Summary

| Table | Columns | RLS | Realtime | Storage |
|-------|---------|-----|----------|---------|
| `orders` | ~17 | Yes | Yes | Supabase |
| `order_events` | 7 | Yes | Yes | Supabase |
| `bookings` | 9 | Yes | No | Supabase |
| `contact_messages` | 8 | Yes | No | Supabase |
| `waiters` | 4 | Yes | Yes | Supabase |
| `menu_items_supabase` | 6 | Yes | No | Supabase |

### 8.2 Orders Table (Final Schema)

```
id                  UUID PRIMARY KEY
customer_name       TEXT NOT NULL
phone               TEXT NOT NULL
order_type          TEXT NOT NULL CHECK ('pickup','delivery','dine-in')
requested_time      TEXT NOT NULL
items_json          TEXT NOT NULL
total               NUMERIC(10,2) NOT NULL CHECK (>= 0)
status              TEXT NOT NULL DEFAULT 'pending' CHECK (pending,confirmed,preparing,ready,completed,cancelled)
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
order_ref           TEXT NOT NULL UNIQUE
server_computed_total  NUMERIC(10,2)
table_number        TEXT
delivery_address    TEXT
idempotency_key     TEXT (unique partial index)
payment_status      TEXT NOT NULL DEFAULT 'pending' CHECK (pending,paid,refunded)
payment_confirmed_at  TIMESTAMPTZ
payment_confirmed_by  TEXT
waiter_name         TEXT
```

### 8.3 Key Relationships

```
orders.id ──→ order_events.order_id (CASCADE DELETE)
```

No other foreign key relationships (waiter_name is a snapshot string, not FK to waiters table).

### 8.4 Risks

- **No referential integrity** between `orders.waiter_name` and `waiters.name` (intentional — snapshots)
- **No foreign key** from `order_events.order_id` to `orders.id` is implicit (but there is a CASCADE DELETE in migration 009)
- **No index** on `orders.status` (frequent query filter) — could slow down kitchen queries at scale
- **No index** on `orders.order_type` (used in analytics queries)
- **No partition** on `orders` table — at thousands of rows, queries might slow

---

## 9. Production Readiness Scorecard

| Subsystem | Score | Reasoning |
|-----------|-------|-----------|
| **Orders** | 7/10 | Core flow works well. Missing: bulk operations, item editing, refund UI. State machine is solid. Payment flow is correct. |
| **Kitchen** | 8/10 | Real-time updates work great. Sound notifications, keyboard shortcuts, auto-cleanup. Limitation: client-side-only auth. |
| **Waiter** | 6/10 | Functional but basic. No waiter-specific auth, no split bills, no order history, no custom customer names. |
| **Admin** | 6/10 | CMS features work but SQLite data loss on deploy is a showstopper. Orders POS is solid. Analytics are basic. |
| **Tracking** | 7/10 | Simple polling works. Shows all relevant info. No real-time updates. Rate-limited. |
| **CMS** | 3/10 | **CRITICAL ISSUE:** All CMS data (menu, events, promotions, settings, images) stored in SQLite — lost on every Vercel redeploy. This makes the CMS effectively non-functional in production. |
| **Authentication** | 5/10 | Works but rough edges. No brute-force protection, 7-day cookies with no rotation, kitchen auth is client-side only, empty passwords by default. |
| **Database** | 7/10 | Good schema design. Missing some indexes. RLS is defense-in-depth. Order state machine is solid. Event logging is excellent. |

### Overall: 6/10

**What works:** Orders system, kitchen display, payment flow, waiter management, tracking.  
**What's broken:** CMS persistence, image uploads, receipt security, login security.  
**What's missing:** Refund UI, bulk operations, waiter-specific auth, proper file storage.

---

## 10. Staff Training Manual

### 10.1 ADMIN MANUAL

#### How to Log In
1. Navigate to `https://the-boma-cafe.vercel.app/admin/login`
2. Enter the admin password (provided by management)
3. You will be redirected to the dashboard
4. Session lasts 7 days (re-login required after)

#### How to Process Orders
1. Go to **Orders** in the sidebar
2. The left panel shows a table grid:
   - Tables with active orders are highlighted blue
3. Click a table to see its orders
4. Order cards show: ref, customer, type, items, total, status, payment status
5. Actions per order:
   - **Accept** — confirm the order
   - **Prepare / Ready / Complete** — move through statuses
   - **Confirm Payment** — for delivery orders, click after payment received
   - **Cancel** — cancel the order
6. Keyboard shortcut: `1` to accept the top pending order

#### How to Manage Menu
1. Go to **Menu** in the sidebar
2. Click **Add Item** to create a new menu item
3. Fill in: name, description, price, category
4. Optional: image, sizes (e.g., Small/Large with different prices), add-ons
5. Toggle **Available** to show/hide from customer menu
6. Click item to edit; ✕ to delete

**⚠️ Warning:** Menu items are stored locally and may be lost on redeploy.

#### How to Manage Promotions
1. Go to **Promotions** in the sidebar
2. Click **Add Promotion**
3. Set title, description, date range, CTA link
4. Toggle **Active** to show/hide on website
5. Toggle **Display on Homepage** / **Display as Popup** / **Display on Menu**

#### How to Manage Events
1. Go to **Events** in the sidebar
2. Tabs: Upcoming / Past / Highlighted
3. Click **Add Event** to create
4. Set title, description, date, image, CTA
5. Toggle **Featured** to highlight on homepage

#### How to Handle Bookings
1. Go to **Bookings** in the sidebar
2. View all booking requests with customer details
3. No approve/cancel buttons currently — contact customer directly
4. Delete outdated bookings with the **Delete** button

#### How to Approve Payments
1. Go to **Orders** in the sidebar
2. Find a delivery order with "🟠 Pending" payment badge
3. Click **Confirm Payment** button on the order card
4. The payment status changes to "🟢 Paid"
5. The kitchen can now prepare the order

#### How to Use Analytics
1. Go to **Analytics** in the sidebar
2. Shows: revenue chart, daily order count, top products, order type breakdown
3. Data from last 30 days

#### How to Manage Waiters
1. Go to **Waiters** in the sidebar
2. **Add:** Type name in the top input, click "+ Add"
3. **Edit:** Click the ✏️ button, type new name, press Enter
4. **Toggle Duty:** Click the 🟢/🔴 button
5. **Delete:** Click 🗑️, confirm in the modal
6. **Search:** Type in the search box to filter
7. Only active (🟢 ON DUTY) waiters appear in the waiter ordering screen

### 10.2 KITCHEN MANUAL

#### How to Access Kitchen
1. Navigate to `https://the-boma-cafe.vercel.app/admin/kitchen`
2. Enter the kitchen password (provided by management)
3. The kitchen display opens in full-screen mode

#### What You See
- **NEW ORDERS** (yellow) — orders waiting to be accepted
- **IN PREP** (blue) — orders being worked on
- **READY** (green) — completed orders waiting for pickup/delivery

#### How to Receive Orders
1. A new order appears in the **NEW ORDERS** column
2. A beep sound plays (if sound is enabled)
3. Click the **Accept** button (or press keyboard `1`)
4. The order moves to **IN PREP**

#### How to Prepare Orders
1. Order is in **IN PREP** column
2. Read the items and any notes
3. Click **Start Preparing** (or keyboard `1`) when you begin
4. Click **Ready** (or keyboard `3`) when finished
5. The order moves to **READY** column

#### How to Handle Payments
- **Delivery orders:** Will show "🟠 Awaiting Payment" if not yet paid. You CANNOT accept these until admin confirms payment.
- **Pickup/Dine-in:** No payment block — proceed as normal

#### Sound & Notifications
- Click the 🔊 button to toggle new-order sounds on/off
- Orders auto-clear from READY column after 5 minutes

#### What You CANNOT Do
- Complete orders (admin does this)
- Cancel orders
- Edit items or prices
- Process payments
- Delete orders

### 10.3 WAITER MANUAL

#### How to Log In
1. Open `https://the-boma-cafe.vercel.app/waiter` on a tablet/phone
2. Enter the waiter password (same as kitchen password)
3. The ordering screen opens

#### How to Create a Dine-In Order

**Step 1: Select Table**
- Grid shows tables 1-20
- Tap the table number you're serving
- **Also select your name** from the dropdown below the grid

**Step 2: Add Items**
- Browse by category (chips at top)
- Tap any item to add to cart
- Use the search bar to find items quickly
- Tap the cart icon (bottom) to review

**Step 3: Review & Submit**
- Check all items and quantities
- Use + and - to adjust quantities
- Verify table number and waiter name are correct
- Tap **Send Order**

**After Submission**
- You'll see a success screen with order reference
- Tap **New Order** to start another

#### What You CANNOT Do
- Edit orders after submission
- View past orders
- Split bills
- Process payments
- Create delivery or pickup orders (dine-in only)
- Change customer name (always "Table X")

### 10.4 MANAGER MANUAL

#### How to Supervise Operations
1. **Dashboard** (`/admin/dashboard`) — overview of site stats and waiter order counts
2. **Orders** (`/admin/orders`) — full order management
3. **Kitchen** (`/admin/kitchen`) — watch kitchen progress

#### How to Approve Payments
1. Go to **Orders** in sidebar
2. Find delivery orders with "🟠 Pending Payment" badge
3. Click **Confirm Payment**
4. System records who confirmed and when

#### How to Cancel Orders
1. Go to **Orders** in sidebar
2. Find the order
3. Click the **Cancel** button (last action button)
4. Order moves to cancelled status
5. Cannot be undone

#### How to Edit Orders
- **Items:** Cannot be edited after creation
- **Customer name/phone:** Can be edited via PATCH API (no UI button)
- **Status:** Can be changed forward through workflow
- **Payment status:** Can be changed (pending → paid → refunded)

#### Staff Management
1. **Waiters** (`/admin/waiters`):
   - Add new waiters
   - Rename waiters
   - Toggle on/off duty
   - Delete waiters (historical orders preserved)
2. **No user accounts** exist — only passwords in environment variables

---

## 11. Known Bugs

| # | Bug | Location | Impact | Workaround |
|---|-----|----------|--------|------------|
| 1 | **CMS data lost on Vercel deploy** | All CMS pages (menu, events, promotions, settings, images) | ❌ Critical — all CMS content disappears after redeploy | Re-enter data manually after each deploy |
| 2 | **Images stored as base64 in SQLite** | Menu items, gallery | ⚠️ High — bloats database, lost on deploy | Use external image URLs |
| 3 | **Receipt page exposes all order data with no auth** | `/receipt/[ref]` | 🔴 Critical — anyone with order ref can see full order details | Keep order refs secret (not fixable without code change) |
| 4 | **Dev mode bypasses all admin auth** | Middleware | 🔴 Critical — local dev exposes admin to anyone | Only run dev on trusted networks |
| 5 | **Empty passwords accepted** | Auth system | 🟠 High — if env vars not set, empty string = valid password | Always set ADMIN_PASSWORD and KITCHEN_PASSWORD |
| 6 | **Kitchen auth is client-side only** | `/admin/kitchen` | 🟠 High — determined user could bypass | Limited impact since kitchen only sees orders |
| 7 | **Waiter page uses kitchen password** | `/waiter` | 🟡 Medium — waiters and kitchen share same password | Set both env vars to same value for now |
| 8 | **Rate limiting resets per instance** | Rate limiter | 🟡 Medium — on Vercel, each cold start resets counters | Acceptable for current scale |
| 9 | **No refund UI** | Admin orders | 🟢 Low — can only mark paid, not refunded | Direct database update required |
| 10 | **No bulk order operations** | Admin orders | 🟢 Low — must process orders one by one | Acceptable for current scale |

---

## 12. Recommended Improvements

### Immediate (Before Production Launch)

1. **Migrate CMS to Supabase** — Move all SQLite CMS tables (menu, events, promotions, etc.) to Supabase tables. This is the single biggest issue — without this, the CMS is non-functional on Vercel.
2. **Use Supabase Storage for images** — Replace filesystem image uploads with Supabase Storage (or Cloudflare R2/S3).
3. **Add auth to receipt page** — At minimum, require a short-lived token or order-specific PIN to view receipt.

### Short Term (Next Sprint)

4. **Add rate limiting to login endpoint** — Prevent brute-force password guessing.
5. **Separate waiter password** — Use the already-declared `WAITER_PASSWORD` env var instead of sharing kitchen password.
6. **Add server-side auth to kitchen page** — Add middleware protection for `/admin/kitchen`.
7. **Add refund UI** — Button to mark payment as refunded.

### Medium Term

8. **Add order filtering/search** to admin orders page (by status, date, type, waiter).
9. **Add calendar view** for bookings.
10. **Add date range filtering** for analytics.
11. **Add batch status updates** (e.g., mark multiple orders ready at once).
12. **Add audit log viewer** in admin (view `order_events` table).

### Long Term

13. **Add proper user accounts** with Supabase Auth instead of password-gated cookies.
14. **Add notification system** (email/SMS) for order status changes.
15. **Add table management** (visual table map, merge/split tables).
16. **Add inventory tracking** linked to menu items.
17. **Add staff shift management** and scheduling.
18. **Add customer accounts** with order history.

---

*End of System Audit & Operator Manual*
