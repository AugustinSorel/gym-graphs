CREATE TYPE "weight_unit" AS ENUM('kg', 'lbs');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weightUnit" "weight_unit" DEFAULT 'kg'::"weight_unit" NOT NULL;