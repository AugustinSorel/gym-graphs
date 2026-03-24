CREATE TABLE "exercises" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercises_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_tiles" ADD COLUMN "exercise_id" integer;--> statement-breakpoint
ALTER TABLE "dashboard_tiles" ADD CONSTRAINT "dashboard_tiles_exercise_id_tag_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "tag"("id") ON DELETE CASCADE;