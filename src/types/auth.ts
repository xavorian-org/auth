export type AuthRole = 'buyer' | 'seller' | 'agent' | 'developer';

export type TwoFactorMethod = 'email' | 'sms' | 'authenticator';

export type AuthStep =
  | 'login'
  | 'signup'
  | 'two_factor'
  | 'forgot_password'
  | 'reset_password';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  accountType?: AuthRole;
  age?: number;
  locationState?: string;
  locationCity?: string;
  phone?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
}

export interface TwoFactorState {
  method: TwoFactorMethod;
  destination: string; // email address or masked phone number
  code: string;
  countdown: number;
  isVerifying: boolean;
  error?: string | null;
  message?: string | null;
}

export interface XavorianAuthEvent {
  type: 'xavorian_auth_event';
  event:
    | 'LOGIN_SUCCESS'
    | 'SIGNUP_SUCCESS'
    | 'VERIFY_SUCCESS'
    | 'SESSION_CREATED'
    | 'AUTH_CLOSED'
    | 'AUTH_REDIRECT'
    | 'ERROR';
  data?: {
    userId?: string;
    email?: string;
    role?: AuthRole;
    session?: any;
    targetPath?: string;
    errorMessage?: string;
    timestamp?: string;
  };
}

export interface AuthWidgetProps {
  initialStep?: AuthStep;
  defaultRole?: AuthRole;
  redirectUrl?: string;
  onSuccess?: (event: XavorianAuthEvent) => void;
  onExit?: () => void;
  isEmbedded?: boolean;
  showShowcase?: boolean;
}
