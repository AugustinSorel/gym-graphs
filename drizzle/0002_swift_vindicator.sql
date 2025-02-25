ALTER TABLE "public"."team_join_request" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."team_join_request_status";--> statement-breakpoint
CREATE TYPE "public"."team_join_request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
ALTER TABLE "public"."team_join_request" ALTER COLUMN "status" SET DATA TYPE "public"."team_join_request_status" USING "status"::"public"."team_join_request_status";