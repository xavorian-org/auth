# Xavorian Authentication Layer: How It Works

This document provides a comprehensive technical walkthrough of the `@xavorian/authentication` module located at `/authentication`. It is designed as an authoritative reference for engineers maintaining, extending, or embedding this authentication layer.

---

## 1. Architectural Overview & Philosophy

The `@xavorian/authentication` layer is built as a **self-contained, decoupled authentication micro-module**.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Host Application                           │
│     (e.g., Xavorian Main Web App / Mobile App / Portal)        │
└───────────────┬─────────────────────────────────▲───────────────┘
                │ Embedded via <iframe> or import │
                │ Custom props & themes           │ postMessage
                ▼                                 │ ('xavorian_auth_event')
┌─────────────────────────────────────────────────┴───────────────┐
│              /authentication Standalone Layer                   │
│                                                                 │
│  ┌────────────────────────┐        ┌─────────────────────────┐  │
│  │   AuthShowcase (Left)  │        │   Active View (Right)   │  │
│  │ - Title Registry Audit │        │ - LoginView             │  │
│  │ - KYC-Verified Network │◄──────►│ - SignupView            │  │
│  │ - Safe Escrow Badges   │        │ - TwoFactorView (2FA)   │  │
│  │ - Smooth Auto-cycle    │        │ - ForgotPasswordView    │  │
│  └────────────────────────┘        │ - ResetPasswordView     │  │
│                                    └────────────┬────────────┘  │
│                                                 │               │
│  ┌──────────────────────────────────────────────▼────────────┐  │
│  │               State & Service Layer                       │  │
│  │   useAuth() │ useTwoFactor() │ authService │ supabase      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Design Principles
1. **Zero External Workspace Couplings**: The module does not depend on parent workspace components, utils, or styling. It contains its own `package.json`, Vite configuration, TypeScript settings, brand assets, and styling tokens.
2. **Portability First**: The entire `authentication/` directory can be dragged into any project, submodule, or standalone repository, and boots with `npm install && npm run dev`.
3. **Bi-directional Event Streaming**: Whenever a user successfully authenticates, registers, verifies 2FA, or closes the view, a structured `xavorian_auth_event` message is emitted via `window.parent.postMessage` so embedding hosts can react without coupling.
4. **Resilient Fallbacks**: If edge functions are unreachable or rate-limited, fail-safe validation hooks prevent user lockouts.

---

## 2. Directory & Component Inventory

```
authentication/
├── index.html                   # HTML template loading Plus Jakarta Sans & Inter
├── package.json                 # Standalone dependencies (@supabase/supabase-js, lucide-react)
├── tsconfig.json                # TypeScript compiler options and '@/*' path aliases
├── vite.config.ts               # Standalone Vite config (runs on port 5174)
├── README.md                    # Module summary and quick start
├── HOW_IT_WORKS.md              # (This document) Comprehensive technical architecture
├── CLERK_INTEGRATION_GUIDE.md   # Clerk Auth + Supabase DB synchronization roadmap
└── src/
    ├── App.tsx                  # Standalone interactive preview harness & event inspector
    ├── main.tsx                 # DOM entry point mounting <App />
    ├── index.css                # Tailwind base, components, and typography tokens
    ├── index.ts                 # Public export barrel exporting all components & hooks
    ├── assets/
    │   └── xavorian-wordmark.svg # High-resolution brand vector
    ├── components/
    │   ├── AuthShowcase.tsx     # Animated glassmorphic rotating security value props
    │   ├── AuthWidget.tsx       # Master coordinator routing active auth steps
    │   ├── LoginView.tsx        # Email/password form with 2FA toggle and remember-device
    │   ├── SignupView.tsx       # Multi-role signup with Nigerian states and strength meter
    │   ├── TwoFactorView.tsx    # Multi-channel 2FA (Email OTP, SMS, Authenticator App)
    │   ├── ForgotPasswordView.tsx # Step-by-step password recovery flow
    │   └── ResetPasswordView.tsx  # Password change confirmation with criteria checks
    ├── hooks/
    │   ├── useAuth.ts           # Session lifecycle, sign in, sign out, profile sync
    │   └── useTwoFactor.ts      # 2FA state machine, countdown timers, channel switching
    ├── services/
    │   ├── authService.ts       # Supabase client wrapper and Edge Function triggers
    │   └── supabaseClient.ts    # Configured Supabase client with override support
    └── types/
        └── auth.ts              # TypeScript interfaces for users, roles, events, and steps
```

---

## 3. End-to-End User Journeys

### A. Login Flow (`LoginView.tsx`)
1. User enters verified `email` and `password`.
2. Can toggle password visibility via `<Eye />` / `<EyeOff />`.
3. "Remember this device" persists user session tokens in `localStorage`.
4. **Standard Path**: Calls `authService.signIn({ email, password })`.
   - Fires asynchronous background audit notification (`authService.logSessionAudit()`).
   - Dispatches `LOGIN_SUCCESS` event to parent postMessage and invokes `onSuccess` callback.
5. **2FA Guard Path**: User can click "+ Verify with 2FA" or the account can enforce 2FA.
   - Dispatches initial 6-digit code via email or phone.
   - Smoothly transitions state to `two_factor` view with existing credentials context.

### B. Signup Flow (`SignupView.tsx`)
1. **Role Selection**: User picks their persona:
   - `buyer`: Property Buyer / Tenant looking for audit-checked listings.
   - `seller`: Property Owner / Landlord publishing listings.
   - `agent`: Licensed Broker managing multiple client transactions.
   - `developer`: Construction & Off-plan Estate developer.
2. **Nigerian Geolocation & Age Compliance**:
   - Minimum age gate (>= 16 years old) with validation.
   - Dropdown of all 36 Nigerian States + FCT (`Lagos`, `Abuja FCT`, `Edo`, `Rivers`, etc.).
   - City input to route relevant property feeds.
3. **Password Security Meter**:
   - Real-time evaluation of length, uppercase, numbers, and special characters.
   - Dynamic progress visual: *Weak* (rose) ➔ *Good* (amber) ➔ *Strong & Secure* (emerald).
4. **Submission**:
   - Calls `authService.signUp()` passing user metadata.
   - Emits `SIGNUP_SUCCESS` event.
   - Advances to `two_factor` view for immediate verification.

### C. Two-Factor Authentication Flow (`TwoFactorView.tsx`)
Designed to solve Nigerian real estate fraud by verifying identity before authorizing offers or viewing private land registry titles:
1. **Channel Selection**:
   - **Email Code OTP**: Dispatches code to user's email via Supabase Edge Function `send-auth-code`.
   - **SMS / Phone**: Formats Nigerian phone (`+234 801 234 5678`) and simulates SMS OTP gateway.
   - **Authenticator App (TOTP)**: Compatible with Google Authenticator, Microsoft Authenticator, and Authy.
2. **Individual Digit Slots**:
   - 6 individual slots with automatic focus advance and backspace reverse.
   - Full 6-digit paste support (e.g. copying `482910` from SMS or email pastes into all 6 slots instantly).
   - Once all 6 slots are filled, automatic verification triggers without requiring an extra click.
3. **Cooldown Timer**:
   - 60-second live countdown timer before allowing "Resend Code" to prevent email/SMS abuse.
4. **Verification**:
   - Verifies code via `verify-auth-code` Edge Function.
   - Emits `VERIFY_SUCCESS` event to parent window and unlocks dashboard navigation.

### D. Password Recovery (`ForgotPasswordView.tsx` & `ResetPasswordView.tsx`)
1. User provides registered email.
2. Dispatches password reset link via Supabase Auth.
3. User receives feedback state showing confirmation card with instructions.
4. When arriving from recovery link, `ResetPasswordView` renders new password form with criteria check and confirmation.

---

## 4. State Management & Hooks

### `useAuth.ts`
Manages the active authentication state:
```typescript
const { user, loading, error, isAuthenticated, signIn, signUp, signOut } = useAuth();
```
- Subscribes to Supabase `onAuthStateChange` to synchronize sessions automatically.
- Formats raw Supabase user payloads into clean `AuthUser` objects.

### `useTwoFactor.ts`
Coordinates the 2FA state machine:
```typescript
const {
  method,          // 'email' | 'sms' | 'authenticator'
  code,            // 6-digit string
  isVerifying,     // boolean loading state
  countdown,       // seconds remaining until resend allowed
  canResend,       // boolean
  sendCode,        // triggers code dispatch
  verifyCode,      // validates 6-digit code
  switchMethod     // changes active channel
} = useTwoFactor({ email, phone, purpose, onSuccess });
```

---

## 5. Host Communication Protocol (`postMessage`)

When embedded as an iframe, the widget communicates with the host application using standard window messaging:

```typescript
export interface XavorianAuthEvent {
  type: 'xavorian_auth_event';
  event:
    | 'LOGIN_SUCCESS'
    | 'SIGNUP_SUCCESS'
    | 'VERIFY_SUCCESS'
    | 'SESSION_CREATED'
    | 'AUTH_CLOSED';
  data?: {
    userId?: string;
    email?: string;
    role?: 'buyer' | 'seller' | 'agent' | 'developer';
    session?: any;
    targetPath?: string;
    timestamp?: string;
  };
}
```

### Listening in Host Applications (e.g. React / Next.js / Vue):
```typescript
useEffect(() => {
  const handleAuthEvent = (event: MessageEvent) => {
    if (event.data?.type === 'xavorian_auth_event') {
      const { event: action, data } = event.data;
      if (action === 'LOGIN_SUCCESS' || action === 'VERIFY_SUCCESS') {
        window.location.href = data?.targetPath || '/dashboard';
      } else if (action === 'SIGNUP_SUCCESS') {
        window.location.href = '/onboarding';
      }
    }
  };

  window.addEventListener('message', handleAuthEvent);
  return () => window.removeEventListener('message', handleAuthEvent);
}, []);
```

---

## 6. How to Run & Test Standalone

The module contains a test harness in `src/App.tsx` specifically built for testing and previewing all authentication states:

```bash
# Navigate to the authentication directory
cd authentication

# Install standalone dependencies
npm install

# Start development server on port 5174
npm run dev
```

### Interactive Test Controls:
- **Step Switcher**: Instantly switch between Login, Signup, 2FA, and Forgot Password views.
- **Mode Toggle**: Switch between **Portal Mode** (full page with showcase) and **Widget Mode** (compact embed).
- **Showcase Toggle**: Show or hide the left branding panel.
- **Event Log Footer**: Live display of emitted `postMessage` payloads with dismissal button.

---

## 7. How to Move this Folder to Another Repository

To extract this module into an independent repository or service:
1. Copy the `authentication/` directory to your new location.
2. In the new repository, configure `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```
3. Run `npm install` and deploy directly to Vercel, Netlify, or Cloudflare Pages.
