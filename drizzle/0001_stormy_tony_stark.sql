ALTER TABLE "tile_tag" RENAME TO "tile_to_tags";--> statement-breakpoint
ALTER TABLE "tile_to_tags" DROP CONSTRAINT "tile_tag_tile_id_tile_id_fk";
--> statement-breakpoint
ALTER TABLE "tile_to_tags" DROP CONSTRAINT "tile_tag_tag_id_tag_id_fk";
--> statement-breakpoint
ALTER TABLE "tile_to_tags" DROP CONSTRAINT "tile_tag_tile_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "tile_to_tags" ADD CONSTRAINT "tile_to_tags_tile_id_tag_id_pk" PRIMARY KEY("tile_id","tag_id");--> statement-breakpoint
ALTER TABLE "tile_to_tags" ADD CONSTRAINT "tile_to_tags_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tile_to_tags" ADD CONSTRAINT "tile_to_tags_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;