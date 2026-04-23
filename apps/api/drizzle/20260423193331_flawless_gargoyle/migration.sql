CREATE TABLE "exercises_to_tags" (
	"exercise_id" integer,
	"tag_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_to_tags_pkey" PRIMARY KEY("exercise_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "dashboard_tiles_to_tags" DROP CONSTRAINT "dashboard_tiles_to_tags_YuatKHcVkZut_fkey";--> statement-breakpoint
DROP TABLE "dashboard_tiles";--> statement-breakpoint
DROP TABLE "dashboard_tiles_to_tags";--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "index" serial;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exercises_to_tags" ADD CONSTRAINT "exercises_to_tags_exercise_id_exercises_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "exercises_to_tags" ADD CONSTRAINT "exercises_to_tags_tag_id_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE;--> statement-breakpoint
DROP TYPE "dashboard_type";