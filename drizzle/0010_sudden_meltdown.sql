ALTER TABLE "exercise" DROP CONSTRAINT "exercise_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise" DROP CONSTRAINT "exercise_userId_name_unique";--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise" ADD CONSTRAINT "exercise_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "exercise" DROP COLUMN IF EXISTS "userId";--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_user_id_name_unique" UNIQUE("user_id","name");