// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import { date, index, integer, jsonb, pgEnum, pgTableCreator } from "drizzle-orm/pg-core";
import { text, timestamp, boolean } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `ligaocemv3_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);


export const user = createTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("banned_reason"),
  banExpires: date("banned_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = createTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by").references(() => user.id, { onDelete: "cascade" }),
});

export const account = createTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = createTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const graveCluster = createTable("grave_cluster", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  clusterNumber: integer("cluster_number").notNull(),
  coordinates: jsonb("coordinates").$type<{
    latitude: number;
    longitude: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const graveDetails = createTable("grave_details", {
  id: text("id").primaryKey(),
  graveJson: jsonb("grave_json"),
  graveClusterId: text("grave_cluster_id")
    .notNull()
    .references(() => graveCluster.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const clusterInstructions = createTable("cluster_instructions", {
  id: text("id").primaryKey(),
  graveClusterId: text("grave_cluster_id")
    .notNull()
    .references(() => graveCluster.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const clusterInstructionSteps = createTable("cluster_instruction_steps", {
  id: text("id").primaryKey(),
  step: integer("step").notNull(),
  instruction: text("instruction").notNull(),
  imageUrl: text("image_url"),
  clusterInstructionsId: text("cluster_instructions_id")
    .notNull()
    .references(() => clusterInstructions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const gravePicture = createTable("grave_picture", {
  id: text("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  imageAlt: text("image_alt"),
  description: text("description"),
  graveDetailsId: text("grave_details_id")
    .notNull()
    .references(() => graveDetails.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const graveRelatedUsers = createTable("grave_related_users", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  graveDetailsId: text("grave_details_id")
    .notNull()
    .references(() => graveDetails.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const requestStatusEnum = pgEnum("request_status_enum", ["pending", "approved", "rejected", "processing"]);

export const requestStatusTable = createTable("request_status", {
  id: text("id").primaryKey(),
  status: requestStatusEnum("status").notNull(),
  remark: text("remark"),
  requestId: text("request_id")
    .notNull()
    .references(() => request.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const requestGraveRelation = createTable("request_grave_relation", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => request.id, { onDelete: "cascade" }),
  graveDetailsId: text("grave_details_id")
    .notNull()
    .references(() => graveDetails.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const request = createTable("request", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  requestDetails: text("request_details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});



// Relations

export const requestRelations = relations(request, ({ one }) => ({
  status: one(requestStatusTable, {
    fields: [request.id],
    references: [requestStatusTable.requestId],
  }),
  graveDetails: one(graveDetails, {
    fields: [request.id],
    references: [graveDetails.id],
  }),
  graveRelatedUsers: one(graveRelatedUsers, {
    fields: [request.id],
    references: [graveRelatedUsers.graveDetailsId],
  }),
  requesterDetails: one(user, {
    fields: [request.userId],
    references: [user.id],
  }),
}));


export const requestGraveRelationRelations = relations(requestGraveRelation, ({ one }) => ({
  request: one(request, {
    fields: [requestGraveRelation.requestId],
    references: [request.id],
  }),
  graveDetails: one(graveDetails, {
    fields: [requestGraveRelation.graveDetailsId],
    references: [graveDetails.id],
  }),
}));


export const userRelations = relations(user, ({ many }) => ({
  requests: many(request),
  graveRelatedUsers: many(graveRelatedUsers),
}));

export const graveRelatedUsersRelations = relations(graveRelatedUsers, ({ one }) => ({
  user: one(user, {
    fields: [graveRelatedUsers.userId],
    references: [user.id],
  }),
  graveDetails: one(graveDetails, {
    fields: [graveRelatedUsers.graveDetailsId],
    references: [graveDetails.id],
  }),
}));

export const graveDetailsRelations = relations(graveDetails, ({ one, many }) => ({
  graveCluster: one(graveCluster, {
    fields: [graveDetails.graveClusterId],
    references: [graveCluster.id],
  }),
  graveRelatedUsers: many(graveRelatedUsers),
  requestGraveRelations: many(requestGraveRelation),
  gravePictures: many(gravePicture),
}));

export const graveClusterRelations = relations(graveCluster, ({ many }) => ({
  graveDetails: many(graveDetails),
  clusterInstructions: many(clusterInstructions),
}));

export const clusterInstructionsRelations = relations(clusterInstructions, ({ one, many }) => ({
  graveCluster: one(graveCluster, {
    fields: [clusterInstructions.graveClusterId],
    references: [graveCluster.id],
  }),
  clusterInstructionSteps: many(clusterInstructionSteps),
}));

export const clusterInstructionStepsRelations = relations(clusterInstructionSteps, ({ one }) => ({
  clusterInstructions: one(clusterInstructions, {
    fields: [clusterInstructionSteps.clusterInstructionsId],
    references: [clusterInstructions.id],
  }),
}));

export const gravePictureRelations = relations(gravePicture, ({ one }) => ({
  graveDetails: one(graveDetails, {
    fields: [gravePicture.graveDetailsId],
    references: [graveDetails.id],
  }),
}));