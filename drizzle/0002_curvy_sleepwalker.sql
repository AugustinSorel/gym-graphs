ALTER TABLE "team_invitation" RENAME COLUMN "team_invitation_status" TO "status";--> statement-breakpoint
ALTER TABLE "team_invitation" ADD CONSTRAINT "team_invitation_token_unique" UNIQUE("token");