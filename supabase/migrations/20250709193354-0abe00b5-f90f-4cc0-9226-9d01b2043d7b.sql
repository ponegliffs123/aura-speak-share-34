
-- Fix security issues with database functions and views

-- 1. Fix the handle_new_user function to have a secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Fix the create_or_get_dm_chat function to have a secure search_path
CREATE OR REPLACE FUNCTION create_or_get_dm_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    chat_id uuid;
    participant1_exists boolean;
    participant2_exists boolean;
BEGIN
    -- Try to find existing chat between these two users
    SELECT c.id INTO chat_id
    FROM public.chats c
    WHERE c.is_group = false
    AND EXISTS (
        SELECT 1 FROM public.chat_participants cp1 
        WHERE cp1.chat_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM public.chat_participants cp2 
        WHERE cp2.chat_id = c.id AND cp2.user_id = user2_id
    )
    LIMIT 1;

    -- If no existing chat found, create a new one
    IF chat_id IS NULL THEN
        INSERT INTO public.chats (created_by, is_group)
        VALUES (user1_id, false)
        RETURNING id INTO chat_id;

        -- Add both users as participants
        INSERT INTO public.chat_participants (chat_id, user_id)
        VALUES (chat_id, user1_id), (chat_id, user2_id);
    END IF;

    RETURN chat_id;
END;
$$;

-- 3. Recreate the chat_summaries view without SECURITY DEFINER
DROP VIEW IF EXISTS public.chat_summaries;

CREATE VIEW public.chat_summaries AS
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
            FROM public.chat_participants cp 
            JOIN public.profiles p ON p.id = cp.user_id 
            WHERE cp.chat_id = c.id AND cp.user_id != auth.uid()
            LIMIT 1
        )
        ELSE c.name
    END as display_name,
    -- Get last message
    (SELECT m.content FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
    (SELECT m.created_at FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
    (SELECT m.message_type FROM public.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_type,
    -- Count unread messages (simplified - you might want to implement read receipts)
    (SELECT COUNT(*) FROM public.messages m WHERE m.chat_id = c.id AND m.sender_id != auth.uid())::int as unread_count
FROM public.chats c
WHERE EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.chat_id = c.id AND cp.user_id = auth.uid()
);

-- Grant access to the view
GRANT SELECT ON public.chat_summaries TO authenticated;
