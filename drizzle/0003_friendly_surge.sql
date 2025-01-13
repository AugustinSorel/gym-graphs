CREATE TABLE "exercise_tag" (
	"exercise_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_tag_exercise_id_tag_id_pk" PRIMARY KEY("exercise_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "tag" DROP CONSTRAINT "tag_name_user_id_pk";--> statement-breakpoint
ALTER TABLE "tag" ADD COLUMN "id" integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "tag_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "exercise_tag" ADD CONSTRAINT "exercise_tag_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_tag" ADD CONSTRAINT "exercise_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_name_user_id_unique" UNIQUE("name","user_id");