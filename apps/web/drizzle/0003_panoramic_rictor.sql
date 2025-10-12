CREATE TYPE "public"."dashboard_view" AS ENUM('graph', 'trending');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "dashboardView" "dashboard_view" DEFAULT 'graph' NOT NULL;