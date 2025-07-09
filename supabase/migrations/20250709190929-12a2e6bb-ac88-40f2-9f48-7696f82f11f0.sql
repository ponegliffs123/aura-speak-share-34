
-- Create a function to create or get existing direct message chat between two users
CREATE OR REPLACE FUNCTION create_or_get_dm_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chat_id uuid;
    participant1_exists boolean;
    participant2_exists boolean;
BEGIN
    -- Try to find existing chat between these two users
    SELECT c.id INTO chat_id
    FROM chats c
    WHERE c.is_group = false
    AND EXISTS (
        SELECT 1 FROM chat_participants cp1 
        WHERE cp1.chat_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM chat_participants cp2 
        WHERE cp2.chat_id = c.id AND cp2.user_id = user2_id
    )
    LIMIT 1;

    -- If no existing chat found, create a new one
    IF chat_id IS NULL THEN
        INSERT INTO chats (created_by, is_group)
        VALUES (user1_id, false)
        RETURNING id INTO chat_id;

        -- Add both users as participants
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (chat_id, user1_id), (chat_id, user2_id);
    END IF;

    RETURN chat_id;
END;
$$;

-- Add RLS policy for users to call the function
CREATE POLICY "Users can create DM chats" ON chats
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Update messages RLS to allow updating (for message status, etc.)
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE 
TO authenticated
USING (auth.uid() = sender_id);

-- Create a view for chat summaries with last message info
CREATE OR REPLACE VIEW chat_summaries AS
SELECT 
    c.id,
    c.name,
    c.is_group,
    c.created_at,
    c.updated_at,
    -- Get the other participant's info for DM chats
    CASE 
        WHEN c.is_group = false THEN (
            SELECT p.full_name 
            FROM chat_participants cp 
            JOIN profiles p ON p.id = cp.user_id 
            WHERE cp.chat_id = c.id AND cp.user_id != auth.uid()
            LIMIT 1
        )
        ELSE c.name
    END as display_name,
    -- Get last message
    (SELECT m.content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
    (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
    (SELECT m.message_type FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_type,
    -- Count unread messages (simplified - you might want to implement read receipts)
    (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != auth.uid())::int as unread_count
FROM chats c
WHERE EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = c.id AND cp.user_id = auth.uid()
);

-- Grant access to the view
GRANT SELECT ON chat_summaries TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
