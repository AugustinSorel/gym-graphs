CREATE TABLE "dashboard_tiles_to_tags" (
	"dashboard_tile_id" integer,
	"tag_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_tiles_to_tags_pkey" PRIMARY KEY("dashboard_tile_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "dashboard_tiles_to_tags" ADD CONSTRAINT "dashboard_tiles_to_tags_YuatKHcVkZut_fkey" FOREIGN KEY ("dashboard_tile_id") REFERENCES "dashboard_tiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dashboard_tiles_to_tags" ADD CONSTRAINT "dashboard_tiles_to_tags_tag_id_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE;