import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  discordUserId: varchar('discord_user_id', { length: 32 }).unique().notNull(),
  discordUsername: varchar('discord_username', { length: 100 }).notNull(),
  discordGlobalName: varchar('discord_global_name', { length: 100 }),
  primaryInterest: varchar('primary_interest', { length: 100 }),
  userProfile: varchar('user_profile', { length: 100 }),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stripeCustomers = pgTable('stripe_customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }).unique().notNull(),
  stripePriceId: varchar('stripe_price_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete_expired'
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).default('stripe').notNull(),
  eventId: varchar('event_id', { length: 100 }).unique().notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'success' | 'ignored' | 'failed'
});

export const discordRoleState = pgTable('discord_role_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  memberRole: boolean('member_role').default(false).notNull(),
  proRole: boolean('pro_role').default(false).notNull(),
  founderRole: boolean('founder_role').default(false).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    discordUserId: varchar('discord_user_id', { length: 32 }),
    eventName: varchar('event_name', { length: 100 }).notNull(),
    properties: jsonb('properties').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_analytics_events_name').on(table.eventName),
    index('idx_analytics_events_created_at').on(table.createdAt),
    index('idx_analytics_events_discord_user').on(table.discordUserId),
  ]
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  stripeCustomer: one(stripeCustomers, {
    fields: [users.id],
    references: [stripeCustomers.userId],
  }),
  subscriptions: many(subscriptions),
  roleState: one(discordRoleState, {
    fields: [users.id],
    references: [discordRoleState.userId],
  }),
  analyticsEvents: many(analyticsEvents),
}));

export const stripeCustomersRelations = relations(stripeCustomers, ({ one }) => ({
  user: one(users, {
    fields: [stripeCustomers.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const discordRoleStateRelations = relations(discordRoleState, ({ one }) => ({
  user: one(users, {
    fields: [discordRoleState.userId],
    references: [users.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type NewStripeCustomer = typeof stripeCustomers.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
export type DiscordRoleState = typeof discordRoleState.$inferSelect;
export type NewDiscordRoleState = typeof discordRoleState.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
