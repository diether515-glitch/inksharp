CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY,
	"submission_id" text UNIQUE,
	"full_name" text NOT NULL,
	"contact" text NOT NULL,
	"tattoo_type" text DEFAULT '' NOT NULL,
	"idea_description" text DEFAULT '' NOT NULL,
	"preferred_artist" text DEFAULT '' NOT NULL,
	"preferred_date" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
