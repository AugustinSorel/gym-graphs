ALTER TABLE "exercise_grid_position" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_grid_position" ADD COLUMN "grid_position" serial NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_grid_position" ADD CONSTRAINT "exercise_grid_position_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
