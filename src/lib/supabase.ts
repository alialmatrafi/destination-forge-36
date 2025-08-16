import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-session-id': getOrCreateSessionId(),
    },
  },
});

// Generate or get existing session ID for guests
function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('guest-session-id');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('guest-session-id', sessionId);
  }
  return sessionId;
}

// Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestSession {
  id: string;
  session_id: string;
  created_at: string;
  expires_at: string;
}

export interface Conversation {
  id: string;
  user_id?: string;
  guest_session_id?: string;
  is_guest: boolean;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  metadata?: any;
  created_at: string;
}

export interface Itinerary {
  id: string;
  conversation_id: string;
  city: string;
  country: string;
  days: any[];
  total_cost: number;
  created_at: string;
  updated_at: string;
}