import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);
export const planStatusEnum = pgEnum("plan_status", [
  "active",
  "cancelled",
  "expired",
  "trialing",
]);
export const currencyEnum = pgEnum("currency", ["KES", "USD"]);
export const endpointModeEnum = pgEnum("endpoint_mode", ["capture", "respond"]);
export const httpMethodEnum = pgEnum("http_method", ["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"]);
export const relayMethodEnum = pgEnum("relay_method", ["GET", "POST", "PUT", "PATCH", "DELETE"]);

// ─── Users ────────────────────────────────────────────────────────────────────
// Identity only. Billing/plan state lives in `subscriptions`.

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // WorkOS user ID
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    avatarUrl: text("avatar_url"),
    bannedAt: timestamp("banned_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

// ─── Subscriptions ────────────────────────────────────────────────────────────
// One row per user (unique userId), decoupled from identity so plan/billing
// churn doesn't touch the users table and Paystack fields stay isolated.

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(), // nanoid
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    plan: planEnum("plan").notNull().default("free"),
    planStatus: planStatusEnum("plan_status").notNull().default("active"),
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),

    // Paystack
    paystackCustomerId: text("paystack_customer_id"),
    paystackSubscriptionId: text("paystack_subscription_id"),
    paystackSubscriptionCode: text("paystack_subscription_code"),
    currency: currencyEnum("currency").notNull().default("KES"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: uniqueIndex("subscriptions_user_id_idx").on(t.userId),
    paystackCustomerIdx: index("subscriptions_paystack_customer_idx").on(
      t.paystackCustomerId
    ),
  })
);

// ─── Admins ───────────────────────────────────────────────────────────────────
// One row per admin user, separate from the main users table so admin activity
// tracking is decoupled from regular user/plan data.
//
// `id` is a nanoid used as the canonical admin identifier in audit logs.
// `userId` ties back to the WorkOS identity.

export const admins = pgTable(
  "admins",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: uniqueIndex("admins_user_id_idx").on(t.userId),
  })
);

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const endpoints = pgTable(
  "endpoints",
  {
    id: text("id").primaryKey(), // nanoid slug — this IS the URL slug
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    // Behaviour
    mode: endpointModeEnum("mode").notNull().default("capture"),
    allowedMethods: text("allowed_methods")
      .array()
      .notNull()
      .default(["GET", "POST"]),

    // Response config (used when mode = "respond")
    responseStatus: integer("response_status").notNull().default(200),
    responseBody: text("response_body").default(""),
    responseHeaders: jsonb("response_headers")
      .notNull()
      .default({}),
    responseContentType: text("response_content_type")
      .notNull()
      .default("application/json"),

    // Relay config
    relayEnabled: boolean("relay_enabled").notNull().default(false),
    relayUrl: text("relay_url"),
    relayMethod: relayMethodEnum("relay_method").default("POST"),
    relayHeaders: jsonb("relay_headers").notNull().default({}),
    relayPassthrough: boolean("relay_passthrough").notNull().default(false),
    relayTimeoutMs: integer("relay_timeout_ms").notNull().default(10000),

    // TTL
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("endpoints_user_id_idx").on(t.userId),
    expiresAtIdx: index("endpoints_expires_at_idx").on(t.expiresAt),
    isActiveIdx: index("endpoints_is_active_idx").on(t.isActive),
  })
);

// ─── Requests ─────────────────────────────────────────────────────────────────

export const requests = pgTable(
  "requests",
  {
    id: text("id").primaryKey(), // nanoid
    endpointId: text("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "cascade" }),

    // Incoming request
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    method: text("method").notNull(),
    headers: jsonb("headers").notNull().default({}),
    queryParams: jsonb("query_params").notNull().default({}),
    body: text("body"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    contentType: text("content_type"),

    // What was returned to the caller
    responseStatus: integer("response_status"),
    responseBody: text("response_body"),

    // Relay result
    relayEnabled: boolean("relay_enabled").notNull().default(false),
    relayUrl: text("relay_url"),
    relayStatus: integer("relay_status"),
    relayResponseBody: text("relay_response_body"),
    relayResponseHeaders: jsonb("relay_response_headers").default({}),
    relayDurationMs: integer("relay_duration_ms"),
    relayTimedOut: boolean("relay_timed_out").notNull().default(false),
    relayPassthrough: boolean("relay_passthrough").notNull().default(false),
    relayError: text("relay_error"),
  },
  (t) => ({
    endpointIdIdx: index("requests_endpoint_id_idx").on(t.endpointId),
    receivedAtIdx: index("requests_received_at_idx").on(t.receivedAt),
  })
);

// ─── Plan limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    maxEndpoints: 3,
    maxRequestsPerEndpoint: 500,
    ttlDays: 3,
    relayPassthrough: false,
    customResponseHeaders: false,
    relayTimeoutMs: 5000,
  },
  pro: {
    maxEndpoints: 50,
    maxRequestsPerEndpoint: 10_000,
    ttlDays: 60,
    relayPassthrough: true,
    customResponseHeaders: true,
    relayTimeoutMs: 15000,
  },
  enterprise: {
    maxEndpoints: Infinity,
    maxRequestsPerEndpoint: Infinity,
    ttlDays: 60,
    relayPassthrough: true,
    customResponseHeaders: true,
    relayTimeoutMs: 30000,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;