CREATE TYPE "public"."team_visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "team" RENAME COLUMN "is_public" TO "visibility";