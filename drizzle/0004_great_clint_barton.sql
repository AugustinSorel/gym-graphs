ALTER TYPE "public"."member_role" RENAME TO "team_member_role";--> statement-breakpoint
ALTER TABLE "member" RENAME TO "team_member";--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "member_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "member_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "member_user_id_team_id_pk";--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_team_id_pk" PRIMARY KEY("user_id","team_id");--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;