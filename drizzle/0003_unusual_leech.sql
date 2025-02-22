ALTER TYPE "public"."team_member_role" RENAME TO "member_role";--> statement-breakpoint
ALTER TABLE "teams_to_users" RENAME TO "member";--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "teams_to_users_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "teams_to_users_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "teams_to_users_user_id_team_id_pk";--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_team_id_pk" PRIMARY KEY("user_id","team_id");--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;