CREATE TABLE IF NOT EXISTS "exercise_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "exercise_tag_text_exercise_id_unique" UNIQUE("text","exercise_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_tag" ADD CONSTRAINT "exercise_tag_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
