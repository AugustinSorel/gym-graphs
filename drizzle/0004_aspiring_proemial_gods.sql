ALTER TABLE "exercise" DROP CONSTRAINT "exercise_id_name_unique";--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_userId_name_unique" UNIQUE("userId","name");