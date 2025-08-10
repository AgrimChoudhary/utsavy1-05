import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, mobile_number: string) => Promise<{ error: any }>;
  signIn: (identifier: string, password: string, countryCode?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  mobile_number: string;
}

export interface SignInData {
  identifier: string;
  password: string;
}