-- Multiply existing weight values by 1000 (g → mg) and rename column
UPDATE "sets" SET "weight_in_g" = "weight_in_g" * 1000;
ALTER TABLE "sets" RENAME COLUMN "weight_in_g" TO "weight_in_mg";
