CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"manage_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_manage_token_unique" UNIQUE("manage_token")
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_minutes" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_dates" (
	"date" date PRIMARY KEY NOT NULL,
	"reason" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_confirmed_slot" ON "appointments" USING btree ("starts_at") WHERE "appointments"."status" = 'confirmed';