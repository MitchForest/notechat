ALTER TYPE "public"."entity_type" ADD VALUE 'system';--> statement-breakpoint
CREATE TABLE "smart_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"filter_config" jsonb NOT NULL,
	"is_protected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "icon" text DEFAULT 'folder';--> statement-breakpoint
ALTER TABLE "smart_collections" ADD CONSTRAINT "smart_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_collections" ADD CONSTRAINT "smart_collections_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;