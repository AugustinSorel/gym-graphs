CREATE TABLE "email_verification_code" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_verification_code_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp DEFAULT CURRENT_TIMESTAMP + (15 * interval '1 min') NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_verification_code" ADD CONSTRAINT "email_verification_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;