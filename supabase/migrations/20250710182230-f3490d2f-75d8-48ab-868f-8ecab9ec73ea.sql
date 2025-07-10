-- Fix security definer view issue by recreating chat_summaries view
DROP VIEW IF EXISTS public.chat_summaries;

CREATE VIEW public.chat_summaries AS
SELECT 
  c.id,
  c.name,
  c.is_group,
  c.created_at,
  c.updated_at,
  CASE 
    WHEN c.is_group THEN c.name
    ELSE (
      SELECT COALESCE(p.full_name, p.username, 'Unknown User')
      FROM public.chat_participants cp
      JOIN public.profiles p ON p.id = cp.user_id
      WHERE cp.chat_id = c.id 
      AND cp.user_id != auth.uid()
      LIMIT 1
    )
  END as display_name,
  m.content as last_message,
  m.created_at as last_message_time,
  m.message_type as last_message_type,
  COALESCE((
    SELECT COUNT(*)::integer
    FROM public.messages msg
    WHERE msg.chat_id = c.id
    AND msg.sender_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.message_reads mr
      WHERE mr.message_id = msg.id 
      AND mr.user_id = auth.uid()
    )
  ), 0) as unread_count
FROM public.chats c
LEFT JOIN LATERAL (
  SELECT content, created_at, message_type
  FROM public.messages 
  WHERE chat_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) m ON true
WHERE EXISTS (
  SELECT 1 FROM public.chat_participants cp
  WHERE cp.chat_id = c.id AND cp.user_id = auth.uid()
);