-- Multiply existing weight values by 1000 (kg → g), rename column, and change type to integer
UPDATE "sets" SET "weight_in_kg" = round("weight_in_kg" * 1000);
ALTER TABLE "sets" ALTER COLUMN "weight_in_kg" SET DATA TYPE integer USING "weight_in_kg"::integer;
ALTER TABLE "sets" RENAME COLUMN "weight_in_kg" TO "weight_in_g";
