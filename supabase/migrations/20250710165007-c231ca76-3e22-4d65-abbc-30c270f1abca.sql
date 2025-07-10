
-- Completely drop and recreate the chat_summaries view to ensure SECURITY DEFINER is removed
DROP VIEW IF EXISTS public.chat_summaries CASCADE;

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

-- Ensure proper permissions
GRANT SELECT ON public.chat_summaries TO authenticated;

-- Enable RLS on the view (though views inherit RLS from underlying tables)
ALTER VIEW public.chat_summaries SET (security_invoker = true);
