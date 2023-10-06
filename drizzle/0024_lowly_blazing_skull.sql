DO $$ BEGIN
 CREATE TYPE "muscle_groups" AS ENUM('legs', 'chest', 'biceps', 'triceps', 'back', 'shoulders', 'calfs', 'abs', 'traps');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "muscle_groups" muscle_groups[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise" DROP COLUMN IF EXISTS "tags";