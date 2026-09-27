ALTER TABLE `appointments` ADD COLUMN `oracle_deck` text DEFAULT 'tarot' NOT NULL CHECK (`oracle_deck` IN ('tarot','cigano','ambos'));
--> statement-breakpoint
ALTER TABLE `booking_requests` ADD COLUMN `oracle_deck` text DEFAULT 'tarot' NOT NULL CHECK (`oracle_deck` IN ('tarot','cigano','ambos'));
--> statement-breakpoint
CREATE TABLE `products` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `category` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `price_cents` integer DEFAULT 0 NOT NULL,
  `image_url` text,
  `made_to_order` integer DEFAULT false NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `archived` integer DEFAULT false NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_products_catalog` ON `products` (`archived`,`active`,`sort_order`,`name`);
--> statement-breakpoint
INSERT INTO `products` (`name`,`category`,`description`,`price_cents`,`made_to_order`,`active`,`sort_order`,`created_at`,`updated_at`) VALUES
('Vela elaborada','Velas','Vela preparada com óleos e ervas escolhidos de acordo com a intenção e a energia das cores.',0,true,true,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('Incenso natural artesanal','Incensos','Incenso 100% natural, feito à mão e preparado sob encomenda.',0,true,true,2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('Perfume essencial','Perfumes','Combinação acessível com até três ervas ou essências, criada para a intenção escolhida.',0,true,true,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('Perfume ritual personalizado','Perfumes','Composição personalizada de ervas e essências definida a partir de uma leitura e conversa sobre o que você precisa.',0,true,true,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
PRAGMA optimize;
