ALTER TABLE "exercise" DROP CONSTRAINT "exercise_name_unique";--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_id_name_unique" UNIQUE("id","name");