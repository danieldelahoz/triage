CREATE TABLE "info_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"question" text NOT NULL,
	"reasoning" text,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "root_causes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"description" text NOT NULL,
	"confidence" integer NOT NULL,
	"reasoning" text,
	"cited_ticket_ids" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generation_pass" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "similarity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"similar_ticket_id" uuid NOT NULL,
	"similarity_score" integer NOT NULL,
	"reasoning" text,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"customer_name" text,
	"product_area" text,
	"priority" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"category" text,
	"severity" text,
	"severity_reasoning" text,
	"selected_root_cause_id" uuid,
	"notes" text,
	"final_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "info_gaps" ADD CONSTRAINT "info_gaps_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "root_causes" ADD CONSTRAINT "root_causes_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similarity_links" ADD CONSTRAINT "similarity_links_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similarity_links" ADD CONSTRAINT "similarity_links_similar_ticket_id_tickets_id_fk" FOREIGN KEY ("similar_ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;