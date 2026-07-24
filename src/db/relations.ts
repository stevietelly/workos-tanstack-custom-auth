import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    subscription: r.one.subscriptions({
      from: r.users.id,
      to: r.subscriptions.userId,
    }),
    endpoints: r.many.endpoints(),
    admin: r.one.admins({
      from: r.users.id,
      to: r.admins.userId,
    }),
  },

  subscriptions: {
    user: r.one.users({
      from: r.subscriptions.userId,
      to: r.users.id,
    }),
  },

  admins: {
    user: r.one.users({
      from: r.admins.userId,
      to: r.users.id,
    }),
  },

  endpoints: {
    user: r.one.users({
      from: r.endpoints.userId,
      to: r.users.id,
    }),
    requests: r.many.requests(),
  },

  requests: {
    endpoint: r.one.endpoints({
      from: r.requests.endpointId,
      to: r.endpoints.id,
    }),
  },
}));