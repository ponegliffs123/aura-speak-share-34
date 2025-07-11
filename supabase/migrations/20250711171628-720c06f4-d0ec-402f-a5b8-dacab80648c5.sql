-- Enable real-time for messages table to support push notifications
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;