
-- Add foreign key relationship between chat_participants and profiles
-- First, let's add the foreign key constraint to chat_participants.user_id -> profiles.id
ALTER TABLE public.chat_participants 
ADD CONSTRAINT chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint to contacts table as well for consistency
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_contact_user_id_fkey 
FOREIGN KEY (contact_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
