ALTER TABLE `services` ADD COLUMN `whatsapp_rate_cents` integer DEFAULT 350 NOT NULL;
--> statement-breakpoint
ALTER TABLE `services` ADD COLUMN `call_rate_cents` integer DEFAULT 450 NOT NULL;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `booking_code` text;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `format` text DEFAULT 'whatsapp' NOT NULL CHECK (`format` IN ('whatsapp','call'));
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `duration_minutes` integer DEFAULT 20 NOT NULL;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `quoted_price_cents` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `wants_card_images` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `temple_rules_accepted` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `appointments` SET `booking_code` = 'LEG-' || printf('%06d', `id`) WHERE `booking_code` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_appointments_booking_code` ON `appointments` (`booking_code`);
--> statement-breakpoint
CREATE TABLE `booking_requests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `booking_code` text NOT NULL UNIQUE,
  `customer_id` integer NOT NULL REFERENCES `customers`(`id`),
  `service_id` integer NOT NULL REFERENCES `services`(`id`),
  `preferred_starts_at` text NOT NULL,
  `preferred_ends_at` text NOT NULL,
  `format` text NOT NULL CHECK (`format` IN ('whatsapp','call')),
  `duration_minutes` integer NOT NULL,
  `quoted_price_cents` integer NOT NULL,
  `deposit_cents` integer NOT NULL,
  `wants_card_images` integer DEFAULT false NOT NULL,
  `status` text DEFAULT 'requested' NOT NULL CHECK (`status` IN ('requested','approved','declined','converted')),
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_booking_requests_status_created` ON `booking_requests` (`status`,`created_at`);
--> statement-breakpoint
UPDATE `services` SET
  `name` = 'Tempo reservado',
  `description` = 'Vinte minutos exclusivos para perguntas respondidas por mensagem, áudio ou ligação.',
  `whatsapp_rate_cents` = 350,
  `call_rate_cents` = 450
WHERE `slug` = 'consulta-essencial';
--> statement-breakpoint
UPDATE `services` SET
  `name` = 'Tempo estendido',
  `description` = 'Trinta minutos reservados para perguntas respondidas por mensagem, áudio ou ligação.',
  `whatsapp_rate_cents` = 350,
  `call_rate_cents` = 450
WHERE `slug` = 'consulta-profunda';
--> statement-breakpoint
UPDATE `services` SET
  `description` = 'Abertura temática sobre pensamentos, sentimentos, intenções e tendência do relacionamento. Não inclui perguntas extras.',
  `whatsapp_rate_cents` = 350,
  `call_rate_cents` = 450
WHERE `slug` = 'templo-de-venus';
--> statement-breakpoint
INSERT OR IGNORE INTO `services` (`slug`,`name`,`description`,`price_cents`,`whatsapp_rate_cents`,`call_rate_cents`,`duration_minutes`,`internal_note`,`active`,`sort_order`,`created_at`,`updated_at`) VALUES
('consulta-livre','Consulta Livre','Tempo personalizado de 20 minutos a 3 horas, sujeito à aprovação.',7000,350,450,20,'Requer 50% antes da consulta e 50% após o atendimento.',true,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
PRAGMA optimize;
