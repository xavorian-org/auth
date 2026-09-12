# @xavorian/authentication

Modular Authentication Layer, Two-Factor Authentication (2FA), and Embedded Widget for the Xavorian Real Estate Platform.

This folder is designed to be **completely standalone and portable**. You can run it locally, deploy it as an independent auth microfrontend, or move the entire folder to another project or repository.

---

## Features

- **Multi-Role Registration (`SignupView`)**: Supports Buyer, Seller, Agent, and Developer roles, real-time password strength meter, age validation (16+), and Nigerian state/city selection.
- **Secure Login (`LoginView`)**: Verified credentials authentication, toggle password visibility, "remember this device", and optional direct 2FA guard.
- **Two-Factor Authentication (`TwoFactorView`)**:
  - **Email Code OTP**: 6-slot digit input with auto-advance, 60-second cooldown timer, and resend trigger connected to Supabase Edge Functions (`send-auth-code` / `verify-auth-code`).
  - **SMS / Phone Verification**: Nigerian mobile phone formatting (`+234...`) and OTP code verification.
  - **Authenticator App (TOTP)**: 6-digit TOTP code verification with Google Authenticator / Authy.
- **Password Recovery (`ForgotPasswordView` & `ResetPasswordView`)**: Email recovery links and secured password reset screens.
- **Auth Showcase Panel (`AuthShowcase`)**: Glassmorphic rotating value props showcasing Title Registry Auditing, KYC-Verified Network, and Safe Escrow Payments.
- **Embeddable Auth Widget (`AuthWidget`)**: Embeddable via `<iframe>` or direct React component with cross-origin `window.postMessage` integration.

---

## Directory Structure

```
authentication/
├── index.html                   # Standalone HTML entry
├── package.json                 # Standalone dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration (port 5174)
├── README.md                    # Module documentation
├── HOW_IT_WORKS.md              # Deep technical architecture & lifecycle
├── CLERK_INTEGRATION_GUIDE.md   # Clerk Auth + Supabase DB sync architecture & roadmap
└── src/
    ├── App.tsx                  # Standalone runner & preview test harness
    ├── main.tsx                 # React DOM entry
    ├── index.css                # Styling & design system tokens
    ├── index.ts                 # Public export barrel
    ├── assets/
    │   └── xavorian-wordmark.svg
    ├── components/
    │   ├── AuthShowcase.tsx     # Rotating security benefits panel
    │   ├── AuthWidget.tsx       # Embeddable/standalone widget shell
    │   ├── ForgotPasswordView.tsx # Password recovery flow
    │   ├── LoginView.tsx        # Sign in form
    │   ├── ResetPasswordView.tsx  # Update password form
    │   ├── SignupView.tsx       # Registration with Nigerian states
    │   └── TwoFactorView.tsx    # 2FA (Email, SMS, Authenticator)
    ├── hooks/
    │   ├── useAuth.ts           # Auth session & operations hook
    │   └── useTwoFactor.ts      # 2FA state machine & timer hook
    ├── services/
    │   ├── authService.ts       # Supabase auth wrapper & edge functions
    │   └── supabaseClient.ts    # Supabase initialization
    └── types/
        └── auth.ts              # TypeScript interface definitions
```

---

## Running Standalone

To run the authentication layer independently on port `5174`:

```bash
cd authentication
npm install
npm run dev
```

Open `http://localhost:5174` in your browser. The runner includes interactive controls at the top to toggle between:
- **Steps**: Login, Signup, 2FA, Forgot Password
- **Modes**: Full Portal Mode vs. Compact Embedded Widget Mode
- **Showcase**: Toggle side panel on/off
- **Event Log**: Real-time inspection of emitted authentication events

---

## Moving this Folder to Another Repository

Because this folder is completely self-contained:
1. Copy or cut the `authentication/` directory to your target location.
2. Run `npm install` inside the folder.
3. Configure environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`) in a `.env` file if using a different Supabase project.

---

## Embedding as a Widget (postMessage API)

When embedded inside an `<iframe>` (e.g. by `AuthInlineWidget.tsx` in the main Xavorian application), the authentication widget communicates with the host application using `window.parent.postMessage`.

### Message Payload Format

```typescript
interface XavorianAuthEvent {
  type: 'xavorian_auth_event';
  event: 'LOGIN_SUCCESS' | 'SIGNUP_SUCCESS' | 'VERIFY_SUCCESS' | 'AUTH_CLOSED';
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

### Listening for Events in the Host Application

```typescript
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'xavorian_auth_event') return;

  if (data.event === 'LOGIN_SUCCESS' || data.event === 'VERIFY_SUCCESS') {
    // Navigate to dashboard
    window.location.href = data.data?.targetPath || '/dashboard';
  } else if (data.event === 'SIGNUP_SUCCESS') {
    // Navigate to onboarding
    window.location.href = '/onboarding';
  }
});
```
