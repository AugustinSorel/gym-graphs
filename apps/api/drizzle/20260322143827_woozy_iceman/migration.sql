CREATE TYPE "oauth_provider" AS ENUM('github');--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"provider_id" "oauth_provider",
	"provider_user_id" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY("provider_id","provider_user_id")
);
--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;