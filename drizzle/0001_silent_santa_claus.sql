CREATE TYPE "public"."weight_unit" AS ENUM('kg', 'lbs');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "weightUnit" "weight_unit" DEFAULT 'kg' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_set" ADD CONSTRAINT "exercise_set_done_at_exercise_id_unique" UNIQUE("done_at","exercise_id");--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_user_id_name_unique" UNIQUE("user_id","name");