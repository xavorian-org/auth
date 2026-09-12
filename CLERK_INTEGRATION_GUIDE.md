# Architectural Blueprint: Clerk Authentication + Supabase Data Sync

This document outlines the exact architecture, database migrations, webhook handlers, and frontend integration steps for transitioning the Xavorian authentication layer to **Clerk** as the primary identity provider while retaining **Supabase** as the relational database and profile store.

---

## 1. System Architecture Overview

Per the product specification:
- **Clerk** handles: User identity, registration, password hashing, OAuth (Google/Apple), sessions, Multi-Factor Authentication (2FA/SMS/TOTP), device management, and JWT generation.
- **Supabase** handles: Real estate property listings, transactions, verified title audits, KYC documents, reviews, chats, and user profiles (`public.profiles`).
- **Zero Users in Supabase `auth.users`**: All user identity originates in Clerk. Supabase simply stores and queries profile information synced from Clerk.

```
                      ┌─────────────────────────────────┐
                      │              USER               │
                      └────────────────┬────────────────┘
                                       │ Signs Up / Logs In
                                       ▼
                      ┌─────────────────────────────────┐
                      │          CLERK AUTH             │
                      │  - Identity & Credentials       │
                      │  - 2FA / Phone / Email OTP      │
                      │  - Session Management & Tokens  │
                      └────────────────┬────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
    (1) Webhook Event                             (2) Client Session JWT
    user.created / user.updated                   (contains clerk_id & claims)
                │                                             │
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│   Supabase Edge Function      │             │     Xavorian Frontend / API   │
│       (clerk-webhook)         │             │  (authenticated Supabase RLS) │
│  - Svix Signature Verified    │             └───────────────┬───────────────┘
│  - Parses Clerk payload       │                             │ Queries with
│  - Upserts to public.profiles │                             │ Clerk JWT
└───────────────┬───────────────┘                             │
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                      ┌─────────────────────────────────┐
                      │        SUPABASE DATABASE        │
                      │  - public.profiles (clerk_id)   │
                      │  - public.properties            │
                      │  - public.transactions          │
                      │  - public.reviews               │
                      └─────────────────────────────────┘
```

---

## 2. Database Schema Migration: Decoupling Profiles from `auth.users`

In standard Supabase setups, `public.profiles.id` is a foreign key to Supabase's internal `auth.users(id)`. To support Clerk without storing users in Supabase Auth, `profiles` must use `clerk_id` as the primary or unique key.

### Migration SQL (`supabase/migrations/20260911160000_clerk_auth_profile_sync.sql`)

```sql
-- 1. Add clerk_id column to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS clerk_id text UNIQUE;

-- 2. Create index on clerk_id for fast queries
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id);

-- 3. Update foreign key constraints on dependent tables (if necessary)
-- Allow profiles.id to be generated as UUID or match Clerk user IDs
ALTER TABLE public.profiles 
ALTER COLUMN id DROP DEFAULT;

-- 4. Enable RLS policy based on Clerk JWT 'sub' claim
CREATE OR REPLACE FUNCTION auth.clerk_user_id() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  );
$$;

-- Allow users to view and update their own profile using their Clerk ID
DROP POLICY IF EXISTS "Clerk users can view own profile" ON public.profiles;
CREATE POLICY "Clerk users can view own profile"
  ON public.profiles FOR SELECT
  USING (clerk_id = auth.clerk_user_id() OR auth.uid() = id);

DROP POLICY IF EXISTS "Clerk users can update own profile" ON public.profiles;
CREATE POLICY "Clerk users can update own profile"
  ON public.profiles FOR UPDATE
  USING (clerk_id = auth.clerk_user_id() OR auth.uid() = id);
```

---

## 3. Real-Time Webhook Sync: Clerk ➔ Supabase

Whenever an action occurs in Clerk, Clerk automatically dispatches a secure POST webhook to our Supabase Edge Function.

### Webhook Events Handled:
1. `user.created`: Extracts name, email, account type metadata, phone, and creates row in `public.profiles`.
2. `user.updated`: Synchronizes avatar changes, name changes, or phone number verifications.
3. `user.deleted`: Removes or soft-deletes the profile.

### Edge Function Implementation (`supabase/functions/clerk-webhook/index.ts`)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.15.0';

const WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify Svix signature headers from Clerk
  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature || !WEBHOOK_SECRET) {
    return new Response('Missing webhook verification headers', { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const { id: clerkId, email_addresses, first_name, last_name, unsafe_metadata, image_url } = evt.data;
  const eventType = evt.type;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const primaryEmail = email_addresses?.[0]?.email_address || '';
  const fullName = [first_name, last_name].filter(Boolean).join(' ') || unsafe_metadata?.full_name || 'User';
  const accountType = unsafe_metadata?.account_type || 'buyer';
  const age = unsafe_metadata?.age ? parseInt(unsafe_metadata.age) : null;
  const locationState = unsafe_metadata?.location_state || 'Lagos';
  const locationCity = unsafe_metadata?.location_city || '';

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { error } = await supabase.from('profiles').upsert(
      {
        clerk_id: clerkId,
        email: primaryEmail,
        full_name: fullName,
        account_type: accountType,
        age: age,
        location_state: locationState,
        location_city: locationCity,
        avatar_url: image_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_id' }
    );

    if (error) {
      console.error('Supabase profile upsert error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  } else if (eventType === 'user.deleted') {
    await supabase.from('profiles').delete().eq('clerk_id', clerkId);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## 4. Frontend Integration Options

When the Clerk credentials arrive, the authentication module can be configured in either of two modes:

### Option A: Custom Headless UI (Preserves Xavorian ProMax Design)
Use Clerk's headless hooks to power our existing `LoginView.tsx`, `SignupView.tsx`, and `TwoFactorView.tsx`:
- `useSignIn()`: Handles email, password, and second factor steps (`signIn.attemptSecondFactor({ strategy: 'email_code', code })`).
- `useSignUp()`: Handles role passing (`unsafeMetadata: { account_type, location_state, location_city }`) and email code verification (`signUp.attemptEmailAddressVerification({ code })`).
- `useUser()`: Direct access to authenticated user.

### Option B: Pre-built Clerk Components (Fastest Implementation)
Use Clerk's `<SignIn />` and `<SignUp />` components with Xavorian's custom theme:
```tsx
import { SignIn, SignUp } from '@clerk/clerk-react';

export const ClerkLogin = () => (
  <SignIn
    appearance={{
      variables: {
        colorPrimary: '#7C3AED',
        colorBackground: '#FFFFFF',
        borderRadius: '0.75rem',
      },
      elements: {
        card: 'shadow-2xl rounded-3xl border border-neutral-200',
      }
    }}
  />
);
```

---

## 5. Required Credentials & Environment Variables

Once you set up your Clerk Dashboard project:

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend (`.env`) | Public key from Clerk Dashboard (starts with `pk_test_` or `pk_live_`) |
| `CLERK_SECRET_KEY` | Backend / Edge Functions | Secret key for server-side API calls (starts with `sk_test_` or `sk_live_`) |
| `CLERK_WEBHOOK_SECRET` | Supabase Secrets | Secret key from Clerk Webhooks page (starts with `whsec_`) |

### Setting Supabase Edge Function Secrets:
```bash
supabase secrets set CLERK_WEBHOOK_SECRET="whsec_..."
```

---

## 6. Next Steps When Credentials Are Ready

1. **Provide Clerk Publishable Key & Secret Key**.
2. **Deploy the `clerk-webhook` Edge Function** to receive `user.created` / `user.updated` events.
3. **Run the database migration** to add `clerk_id` to `public.profiles`.
4. **Wire `@clerk/clerk-react` Provider** into `authentication/src/App.tsx` and main app.
