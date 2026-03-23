ALTER TABLE "dashboard_tiles" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_tiles" ADD CONSTRAINT "dashboard_tiles_name_user_id_unique" UNIQUE("name","user_id");