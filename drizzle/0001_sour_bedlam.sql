CREATE TABLE "team" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "team_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"is_public" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_name_unique" UNIQUE("name")
);
