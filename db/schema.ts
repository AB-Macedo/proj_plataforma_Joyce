import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  priceCents: integer('price_cents').notNull(),
  whatsappRateCents: integer('whatsapp_rate_cents').notNull().default(350),
  callRateCents: integer('call_rate_cents').notNull().default(450),
  durationMinutes: integer('duration_minutes').notNull(),
  internalNote: text('internal_note'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const weeklyAvailability = sqliteTable('weekly_availability', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weekday: integer('weekday').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const availabilityExceptions = sqliteTable('availability_exceptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  kind: text('kind', { enum: ['open', 'blocked'] }).notNull(),
  reason: text('reason'),
  createdAt: text('created_at').notNull(),
});

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  whatsapp: text('whatsapp').notNull(),
  email: text('email'),
  consentAt: text('consent_at'),
  createdAt: text('created_at').notNull(),
});

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  bookingCode: text('booking_code').notNull().unique(),
  format: text('format', { enum: ['whatsapp', 'call'] }).notNull().default('whatsapp'),
  durationMinutes: integer('duration_minutes').notNull().default(20),
  quotedPriceCents: integer('quoted_price_cents').notNull().default(0),
  wantsCardImages: integer('wants_card_images', { mode: 'boolean' }).notNull().default(false),
  templeRulesAccepted: integer('temple_rules_accepted', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] }).notNull().default('pending'),
  googleEventId: text('google_event_id'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_appointments_active_slot').on(table.startsAt, table.endsAt).where(sql`${table.status} IN ('pending', 'confirmed')`)]);

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  appointmentId: integer('appointment_id').notNull().references(() => appointments.id),
  amountCents: integer('amount_cents').notNull(),
  method: text('method').notNull().default('pix'),
  status: text('status', { enum: ['pending', 'paid', 'refunded', 'cancelled'] }).notNull().default('pending'),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
});

export const bookingRequests = sqliteTable('booking_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookingCode: text('booking_code').notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  preferredStartsAt: text('preferred_starts_at').notNull(),
  preferredEndsAt: text('preferred_ends_at').notNull(),
  format: text('format', { enum: ['whatsapp', 'call'] }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  quotedPriceCents: integer('quoted_price_cents').notNull(),
  depositCents: integer('deposit_cents').notNull(),
  wantsCardImages: integer('wants_card_images', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['requested', 'approved', 'declined', 'converted'] }).notNull().default('requested'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const messageTemplates = sqliteTable('message_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  channel: text('channel', { enum: ['whatsapp', 'email'] }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});
