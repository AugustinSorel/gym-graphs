CREATE TABLE "password_reset_tokens" (
	"token" text PRIMARY KEY,
	"user_id" integer NOT NULL,
	"expires_at" timestamp DEFAULT CURRENT_TIMESTAMP + (15 * interval '2 hour') NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;