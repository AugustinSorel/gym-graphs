CREATE TABLE "dashboard_fun_facts_tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dashboard_fun_facts_tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tile_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_heat_map_tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dashboard_heat_map_tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tile_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_overview_tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_overview_tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tile_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_set_count_tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_set_count_tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tile_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_tag_count_tile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_tag_count_tile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tile_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tile" DROP CONSTRAINT "tile_exercise_id_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "team_invitation" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."team_invitation_status";--> statement-breakpoint
CREATE TYPE "public"."team_invitation_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
ALTER TABLE "team_invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."team_invitation_status";--> statement-breakpoint
ALTER TABLE "team_invitation" ALTER COLUMN "status" SET DATA TYPE "public"."team_invitation_status" USING "status"::"public"."team_invitation_status";--> statement-breakpoint
ALTER TABLE "dashboard_fun_facts_tile" ADD CONSTRAINT "dashboard_fun_facts_tile_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_heat_map_tile" ADD CONSTRAINT "dashboard_heat_map_tile_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_overview_tile" ADD CONSTRAINT "exercise_overview_tile_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_overview_tile" ADD CONSTRAINT "exercise_overview_tile_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_set_count_tile" ADD CONSTRAINT "exercise_set_count_tile_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_tag_count_tile" ADD CONSTRAINT "exercise_tag_count_tile_tile_id_tile_id_fk" FOREIGN KEY ("tile_id") REFERENCES "public"."tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tile" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "tile" DROP COLUMN "exercise_id";