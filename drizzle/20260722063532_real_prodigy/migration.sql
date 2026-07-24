CREATE TYPE "currency" AS ENUM('KES', 'USD');--> statement-breakpoint
CREATE TYPE "endpoint_mode" AS ENUM('capture', 'respond');--> statement-breakpoint
CREATE TYPE "http_method" AS ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY');--> statement-breakpoint
CREATE TYPE "plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "plan_status" AS ENUM('active', 'cancelled', 'expired', 'trialing');--> statement-breakpoint
CREATE TYPE "relay_method" AS ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE');--> statement-breakpoint
CREATE TABLE "endpoints" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"mode" "endpoint_mode" DEFAULT 'capture'::"endpoint_mode" NOT NULL,
	"allowed_methods" text[] DEFAULT '{GET,POST}'::text[] NOT NULL,
	"response_status" integer DEFAULT 200 NOT NULL,
	"response_body" text DEFAULT '',
	"response_headers" jsonb DEFAULT '{}' NOT NULL,
	"response_content_type" text DEFAULT 'application/json' NOT NULL,
	"relay_enabled" boolean DEFAULT false NOT NULL,
	"relay_url" text,
	"relay_method" "relay_method" DEFAULT 'POST'::"relay_method",
	"relay_headers" jsonb DEFAULT '{}' NOT NULL,
	"relay_passthrough" boolean DEFAULT false NOT NULL,
	"relay_timeout_ms" integer DEFAULT 10000 NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" text PRIMARY KEY,
	"endpoint_id" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text NOT NULL,
	"headers" jsonb DEFAULT '{}' NOT NULL,
	"query_params" jsonb DEFAULT '{}' NOT NULL,
	"body" text,
	"ip" text,
	"user_agent" text,
	"content_type" text,
	"response_status" integer,
	"response_body" text,
	"relay_enabled" boolean DEFAULT false NOT NULL,
	"relay_url" text,
	"relay_status" integer,
	"relay_response_body" text,
	"relay_response_headers" jsonb DEFAULT '{}',
	"relay_duration_ms" integer,
	"relay_timed_out" boolean DEFAULT false NOT NULL,
	"relay_passthrough" boolean DEFAULT false NOT NULL,
	"relay_error" text
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"plan" "plan" DEFAULT 'free'::"plan" NOT NULL,
	"plan_status" "plan_status" DEFAULT 'active'::"plan_status" NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"paystack_customer_id" text,
	"paystack_subscription_id" text,
	"paystack_subscription_code" text,
	"currency" "currency" DEFAULT 'KES'::"currency" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "endpoints_user_id_idx" ON "endpoints" ("user_id");--> statement-breakpoint
CREATE INDEX "endpoints_expires_at_idx" ON "endpoints" ("expires_at");--> statement-breakpoint
CREATE INDEX "endpoints_is_active_idx" ON "endpoints" ("is_active");--> statement-breakpoint
CREATE INDEX "requests_endpoint_id_idx" ON "requests" ("endpoint_id");--> statement-breakpoint
CREATE INDEX "requests_received_at_idx" ON "requests" ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_id_idx" ON "subscriptions" ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_paystack_customer_idx" ON "subscriptions" ("paystack_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_endpoint_id_endpoints_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;