import {
    pgTable,
    serial,
    text,
    uuid,
    boolean,
    timestamp,
    index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'

// ─── activity_logs ───────────────────────────────────────────────────────────
export const activityLogs = pgTable(
    'activity_logs',
    {
        id: serial('id').primaryKey(),
        user_id: uuid('user_id').references(() => profiles.id),
        action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
        entity: text('entity').notNull(),
        entity_id: text('entity_id'),
        description: text('description'),
        metadata: text('metadata'),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_activity_logs_created_at').on(t.created_at)],
)

// ─── notifications ───────────────────────────────────────────────────────────
export const notifications = pgTable(
    'notifications',
    {
        id: serial('id').primaryKey(),
        user_id: uuid('user_id').notNull().references(() => profiles.id),
        title: text('title').notNull(),
        message: text('message').notNull(),
        type: text('type', { enum: ['info', 'success', 'warning', 'error'] }).notNull().default('info'),
        is_read: boolean('is_read').notNull().default(false),
        link: text('link'),
        created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('idx_notifications_user_id').on(t.user_id)],
)

// ─── relations ───────────────────────────────────────────────────────────────

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    user: one(profiles, {
        fields: [activityLogs.user_id],
        references: [profiles.id],
    }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(profiles, {
        fields: [notifications.user_id],
        references: [profiles.id],
    }),
}))
