-- Add message read tracking
ALTER TABLE public.messages 
ADD COLUMN read_at timestamp with time zone;

-- Create message reads table to track who read what message when
CREATE TABLE public.message_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reads
CREATE POLICY "Users can view message reads for their chats" 
ON public.message_reads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
    WHERE m.id = message_reads.message_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can mark messages as read" 
ON public.message_reads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update chat_summaries view to include proper unread count
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

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(chat_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Insert read records for all unread messages in the chat
  INSERT INTO public.message_reads (message_id, user_id)
  SELECT m.id, auth.uid()
  FROM public.messages m
  WHERE m.chat_id = chat_id_param
  AND m.sender_id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.message_reads mr
    WHERE mr.message_id = m.id AND mr.user_id = auth.uid()
  )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;