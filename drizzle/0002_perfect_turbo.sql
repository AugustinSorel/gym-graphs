CREATE TYPE "public"."team_member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "teams_to_users" (
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" "team_member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_to_users_user_id_team_id_pk" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "teams_to_users" ADD CONSTRAINT "teams_to_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams_to_users" ADD CONSTRAINT "teams_to_users_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;