ALTER TYPE "public"."dashboard_tile_type" RENAME TO "tile_type";--> statement-breakpoint
CREATE TABLE "tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "tile_type" NOT NULL,
	"index" serial NOT NULL,
	"dashboard_id" integer NOT NULL,
	"exercise_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tile_dashboard_id_index_unique" UNIQUE("dashboard_id","index")
);
--> statement-breakpoint
ALTER TABLE "dashboard_tile" RENAME TO "dashboard";--> statement-breakpoint
ALTER TABLE "dashboard" DROP CONSTRAINT "dashboard_tile_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dashboard" DROP CONSTRAINT "dashboard_tile_exercise_id_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "tile" ADD CONSTRAINT "tile_dashboard_id_dashboard_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tile" ADD CONSTRAINT "tile_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard" ADD CONSTRAINT "dashboard_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "dashboard" DROP COLUMN "index";--> statement-breakpoint
ALTER TABLE "dashboard" DROP COLUMN "exercise_id";--> statement-breakpoint
ALTER TABLE "dashboard" ADD CONSTRAINT "dashboard_user_id_unique" UNIQUE("user_id");