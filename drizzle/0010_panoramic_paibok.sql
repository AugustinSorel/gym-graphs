ALTER TABLE "exercise_tag" RENAME TO "tile_tag";--> statement-breakpoint
ALTER TABLE "tile_tag" RENAME COLUMN "exercise_id" TO "tile_id";--> statement-breakpoint
ALTER TABLE "exercise" DROP CONSTRAINT "exercise_user_id_name_unique";--> statement-breakpoint
ALTER TABLE "tile_tag" DROP CONSTRAINT "exercise_tag_exercise_id_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "tile_tag" DROP CONSTRAINT "exercise_tag_tag_id_tag_id_fk";
--> statement-breakpoint
ALTER TABLE "tile_tag" DROP CONSTRAINT "exercise_tag_exercise_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "tile_tag" ADD CONSTRAINT "tile_tag_tile_id_tag_id_pk" PRIMARY KEY("tile_id","tag_id");--> statement-breakpoint
ALTER TABLE "tile" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tile_tag" ADD CONSTRAINT "tile_tag_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tile_tag" ADD CONSTRAINT "tile_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "public"."tile" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tile_type";--> statement-breakpoint
CREATE TYPE "public"."tile_type" AS ENUM('exercise', 'tilesToSetsCount', 'tilesToTagsCount', 'tilesSetsHeatMap', 'tilesFunFacts');--> statement-breakpoint
ALTER TABLE "public"."tile" ALTER COLUMN "type" SET DATA TYPE "public"."tile_type" USING "type"::"public"."tile_type";