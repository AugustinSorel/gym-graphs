CREATE TYPE "public"."dashboard_tile_type" AS ENUM('exercise', 'exercisesFrequency', 'tagsFrequency', 'exercisesFunFacts', 'setsHeatMap');--> statement-breakpoint
CREATE TABLE "dashboard_tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dashboard_tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "dashboard_tile_type" NOT NULL,
	"index" serial NOT NULL,
	"user_id" integer NOT NULL,
	"exercise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_tile" ADD CONSTRAINT "dashboard_tile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_tile" ADD CONSTRAINT "dashboard_tile_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;