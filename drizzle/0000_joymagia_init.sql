CREATE TABLE `services` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `price_cents` integer NOT NULL,
  `duration_minutes` integer NOT NULL,
  `internal_note` text,
  `active` integer DEFAULT true NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weekly_availability` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `weekday` integer NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  `active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `availability_exceptions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `date` text NOT NULL,
  `start_time` text,
  `end_time` text,
  `kind` text NOT NULL CHECK (`kind` IN ('open','blocked')),
  `reason` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_availability_exceptions_date` ON `availability_exceptions` (`date`);
--> statement-breakpoint
CREATE TABLE `customers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `whatsapp` text NOT NULL,
  `email` text,
  `consent_at` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customers_whatsapp` ON `customers` (`whatsapp`);
--> statement-breakpoint
CREATE TABLE `appointments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `service_id` integer NOT NULL REFERENCES `services`(`id`),
  `customer_id` integer NOT NULL REFERENCES `customers`(`id`),
  `starts_at` text NOT NULL,
  `ends_at` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL CHECK (`status` IN ('pending','confirmed','completed','cancelled','no_show')),
  `google_event_id` text,
  `notes` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_appointments_active_slot` ON `appointments` (`starts_at`,`ends_at`) WHERE `status` IN ('pending','confirmed');
--> statement-breakpoint
CREATE INDEX `idx_appointments_starts_status` ON `appointments` (`starts_at`,`status`);
--> statement-breakpoint
CREATE TRIGGER `prevent_overlapping_active_appointments`
BEFORE INSERT ON `appointments`
WHEN NEW.`status` IN ('pending','confirmed')
BEGIN
  SELECT RAISE(ABORT, 'appointment overlaps an active appointment')
  WHERE EXISTS (
    SELECT 1 FROM `appointments`
    WHERE `status` IN ('pending','confirmed')
      AND NEW.`starts_at` < `ends_at`
      AND NEW.`ends_at` > `starts_at`
  );
END;
--> statement-breakpoint
CREATE TABLE `payments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `appointment_id` integer NOT NULL REFERENCES `appointments`(`id`),
  `amount_cents` integer NOT NULL,
  `method` text DEFAULT 'pix' NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL CHECK (`status` IN ('pending','paid','refunded','cancelled')),
  `paid_at` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`status`);
--> statement-breakpoint
CREATE TABLE `message_templates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `key` text NOT NULL UNIQUE,
  `channel` text NOT NULL CHECK (`channel` IN ('whatsapp','email')),
  `title` text NOT NULL,
  `body` text NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (`key` text PRIMARY KEY NOT NULL, `value` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
INSERT INTO `services` (`slug`,`name`,`description`,`price_cents`,`duration_minutes`,`internal_note`,`active`,`sort_order`,`created_at`,`updated_at`) VALUES
('consulta-essencial','Consulta Essencial','Consulta por mensagem ou áudio.',7000,20,NULL,true,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('consulta-profunda','Consulta Profunda','Consulta em áudio com mais tempo para aprofundamento.',10500,30,NULL,true,2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('templo-de-venus','Templo de Vênus','Leitura temática para relacionamentos.',5000,20,'O atendimento não pode ultrapassar 17 minutos.',true,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
INSERT INTO `weekly_availability` (`weekday`,`start_time`,`end_time`,`active`) VALUES
(1,'13:00','19:00',true),(2,'13:00','19:00',true),(4,'13:00','19:00',true),(5,'12:00','15:00',true),(6,'13:00','19:00',true);
--> statement-breakpoint
INSERT INTO `message_templates` (`key`,`channel`,`title`,`body`,`active`,`updated_at`) VALUES
('whatsapp_greeting','whatsapp','Saudação','Olá! Para consultar serviços, valores e horários disponíveis, acesse o nosso link de agendamento.',true,CURRENT_TIMESTAMP),
('booking_confirmation','email','Agendamento confirmado','Seu horário foi reservado. Em breve você receberá as orientações para o atendimento.',true,CURRENT_TIMESTAMP),
('booking_cancellation','email','Agendamento cancelado','Seu agendamento foi cancelado conforme solicitado.',true,CURRENT_TIMESTAMP);
--> statement-breakpoint
PRAGMA optimize;
