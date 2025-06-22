-- Add missing columns to chats table
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS content jsonb,
ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false; 