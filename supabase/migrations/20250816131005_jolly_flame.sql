/*
  # Add guest sessions support

  1. New Tables
    - `guest_sessions`
      - `id` (uuid, primary key)
      - `session_id` (text, unique) - browser session identifier
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
    
  2. Modifications
    - Add `guest_session_id` to conversations table
    - Add `is_guest` flag to conversations table
    - Update RLS policies to support guest access
    
  3. Security
    - Enable RLS on guest_sessions table
    - Add policies for guest session management
    - Allow guest access to their own data
*/

-- Create guest sessions table
CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

-- Add guest session support to conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'guest_session_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN guest_session_id uuid REFERENCES guest_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'is_guest'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_guest boolean DEFAULT false;
  END IF;
END $$;

-- Update conversations table to make user_id nullable for guests
ALTER TABLE conversations ALTER COLUMN user_id DROP NOT NULL;

-- Guest session policies
CREATE POLICY "Anyone can create guest sessions"
  ON guest_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own guest session"
  ON guest_sessions
  FOR SELECT
  TO anon
  USING (session_id = current_setting('request.headers')::json->>'x-session-id');

-- Update conversation policies for guest support
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- New conversation policies supporting both authenticated users and guests
CREATE POLICY "Users and guests can create conversations"
  ON conversations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND is_guest = false) OR
    (auth.uid() IS NULL AND is_guest = true AND guest_session_id IS NOT NULL)
  );

CREATE POLICY "Users and guests can read own conversations"
  ON conversations
  FOR SELECT
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
      SELECT id FROM guest_sessions 
      WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
    ))
  );

CREATE POLICY "Users and guests can update own conversations"
  ON conversations
  FOR UPDATE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
      SELECT id FROM guest_sessions 
      WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
    ))
  );

CREATE POLICY "Users and guests can delete own conversations"
  ON conversations
  FOR DELETE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
      SELECT id FROM guest_sessions 
      WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
    ))
  );

-- Update message policies for guest support
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can read messages from own conversations" ON messages;

CREATE POLICY "Users and guests can create messages in own conversations"
  ON messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
            (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
              SELECT id FROM guest_sessions 
              WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
            ))
    )
  );

CREATE POLICY "Users and guests can read messages from own conversations"
  ON messages
  FOR SELECT
  TO anon, authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
            (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
              SELECT id FROM guest_sessions 
              WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
            ))
    )
  );

-- Update itinerary policies for guest support
DROP POLICY IF EXISTS "Users can create itineraries in own conversations" ON itineraries;
DROP POLICY IF EXISTS "Users can read itineraries from own conversations" ON itineraries;
DROP POLICY IF EXISTS "Users can update itineraries from own conversations" ON itineraries;

CREATE POLICY "Users and guests can create itineraries in own conversations"
  ON itineraries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
            (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
              SELECT id FROM guest_sessions 
              WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
            ))
    )
  );

CREATE POLICY "Users and guests can read itineraries from own conversations"
  ON itineraries
  FOR SELECT
  TO anon, authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
            (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
              SELECT id FROM guest_sessions 
              WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
            ))
    )
  );

CREATE POLICY "Users and guests can update itineraries from own conversations"
  ON itineraries
  FOR UPDATE
  TO anon, authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
            (auth.uid() IS NULL AND is_guest = true AND guest_session_id IN (
              SELECT id FROM guest_sessions 
              WHERE session_id = current_setting('request.headers')::json->>'x-session-id'
            ))
    )
  );

-- Function to migrate guest data to user account
CREATE OR REPLACE FUNCTION migrate_guest_data_to_user(
  p_session_id text,
  p_user_id uuid
) RETURNS void AS $$
DECLARE
  guest_session_uuid uuid;
BEGIN
  -- Get guest session ID
  SELECT id INTO guest_session_uuid 
  FROM guest_sessions 
  WHERE session_id = p_session_id;
  
  IF guest_session_uuid IS NOT NULL THEN
    -- Update conversations to belong to the user
    UPDATE conversations 
    SET user_id = p_user_id, 
        is_guest = false, 
        guest_session_id = NULL
    WHERE guest_session_id = guest_session_uuid;
    
    -- Delete the guest session
    DELETE FROM guest_sessions WHERE id = guest_session_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;