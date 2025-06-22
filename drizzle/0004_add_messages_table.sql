-- Add messages table for better pagination support
CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chat_id" uuid NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" 
  FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_messages_chat_id" ON "messages"("chat_id");
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages"("created_at");

-- Add soft delete support to chats table for the auto-delete feature
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp; 