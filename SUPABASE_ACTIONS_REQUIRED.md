# Supabase Actions Required

## Overview

Your Supabase project is configured but requires manual steps in the Supabase Dashboard to work correctly. The application code has been fixed to use two separate Supabase clients:

- **`supabase`** — Public/anonymous client (respects RLS). Used for client-side operations.
- **`supabaseAdmin`** — Admin server client (bypasses RLS via service_role key). Used for all API routes.

---

## Step 1: Get Your Supabase Keys

1. Log in to https://supabase.com
2. Select your project: **lyksqvqtiysjttwpgeyw**
3. Go to **Project Settings → API** (in the left sidebar)

You will see two keys:

| Key Name | Current Value | What to Do |
|----------|--------------|------------|
| **Project URL** | `https://lyksqvqtiysjttwpgeyw.supabase.co` | Already set correctly |
| **anon public** (starts with `sb_anon_` or `eyJ...`) | Hidden | Copy this value |
| **service_role** (starts with `sb_service_role_` or `eyJ...`) | Hidden | Copy this value |

---

## Step 2: Update `.env.local`

Open `.env.local` in the project root and update the placeholder values:

```env
# Already set correctly:
NEXT_PUBLIC_SUPABASE_URL=https://lyksqvqtiysjttwpgeyw.supabase.co

# Replace the key below with the actual "anon public" key from Step 1:
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_public_key_here

# Replace below with the actual "service_role" key from Step 1:
SUPABASE_SERVICE_ROLE_KEY=paste_service_role_key_here
```

**Important:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose to the browser (it's prefixed with `NEXT_PUBLIC_`)
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and must NEVER be exposed to the client

> **Note about the current key**: The `.env.local` currently contains a `sb_publishable_` key. This is a publishable key format, not the anon key. The application needs the **anon public key** (usually starts with `sb_anon_` or is a JWT `eyJ...`). If your Supabase dashboard only shows "Publishable key" and "Secret key" (no "anon public"), use the "Publishable key" as the anon key and the "Secret key" as the service role key.

---

## Step 3: Apply the Database Migration (if not already applied)

1. Go to **SQL Editor** in the Supabase Dashboard
2. Open or paste the file `supabase/migrations/001_create_tables.sql`
3. Click **Run** to execute the migration

The migration will:
- Create the `bookings`, `orders`, and `contact_messages` tables (if not exist)
- Enable Row Level Security (RLS) on all tables
- Create INSERT policies for `anon` and `public` roles (to allow anonymous form submissions)
- Create SELECT/UPDATE/DELETE policies for `authenticated` role (for admin panel access)

If you already created the tables manually, the `CREATE TABLE IF NOT EXISTS` statements will skip them. The RLS policies will be recreated.

---

## Step 4: Verify RLS Policies Are Correct

After running the migration, verify the policies exist:

1. Go to **Table Editor** in Supabase Dashboard
2. Select each table (`bookings`, `orders`, `contact_messages`)
3. Click **RLS Policies** tab
4. Confirm you see policies for both `anon`/`public` INSERT and `authenticated` SELECT/UPDATE/DELETE

Expected policies per table:

| Table | Policy Name | Target Roles | Operation |
|-------|------------|-------------|-----------|
| bookings | Allow anon insert bookings | anon | INSERT |
| bookings | Allow public insert bookings | public | INSERT |
| bookings | Allow authenticated read bookings | authenticated | SELECT |
| bookings | Allow authenticated update bookings | authenticated | UPDATE |
| bookings | Allow authenticated delete bookings | authenticated | DELETE |
| orders | Allow anon insert orders | anon | INSERT |
| orders | Allow public insert orders | public | INSERT |
| orders | Allow authenticated read orders | authenticated | SELECT |
| orders | Allow authenticated update orders | authenticated | UPDATE |
| orders | Allow authenticated delete orders | authenticated | DELETE |
| contact_messages | Allow anon insert contact_messages | anon | INSERT |
| contact_messages | Allow public insert contact_messages | public | INSERT |
| contact_messages | Allow authenticated read contact_messages | authenticated | SELECT |
| contact_messages | Allow authenticated delete contact_messages | authenticated | DELETE |

---

## Troubleshooting

If form submissions still fail after completing all steps:

1. **Check the browser console** for the actual error message from the API response
2. **Check the Supabase logs**: Go to **Logs → PostgREST** to see the exact database errors
3. **Verify env vars**: Run the dev server and confirm `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` and `process.env.SUPABASE_SERVICE_ROLE_KEY` are both set
4. **Restart the dev server** after changing `.env.local` (environment variables are cached at server start)
