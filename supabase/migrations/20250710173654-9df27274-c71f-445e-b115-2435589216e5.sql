-- Fix infinite recursion in chat_participants RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of chats they're in" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to chats they created" ON public.chat_participants;

-- Create a security definer function to check if user is a chat participant
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_id_param uuid, user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chat_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to check if user created a chat
CREATE OR REPLACE FUNCTION public.is_chat_creator(chat_id_param uuid, user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chats 
    WHERE id = chat_id_param AND created_by = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the security definer functions
CREATE POLICY "Users can view participants of chats they're in" 
ON public.chat_participants 
FOR SELECT 
USING (public.is_chat_participant(chat_id, auth.uid()));

CREATE POLICY "Users can add participants to chats they created" 
ON public.chat_participants 
FOR INSERT 
WITH CHECK (public.is_chat_creator(chat_id, auth.uid()));