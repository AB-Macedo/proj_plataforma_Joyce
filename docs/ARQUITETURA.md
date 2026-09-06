# Arquitetura e integrações

## Visão geral

O produto será uma aplicação web responsiva com duas áreas no mesmo projeto:

- `/`: experiência pública para conhecer e agendar serviços;
- `/painel`: área privada para administrar agenda, conteúdo, clientes e caixa.

O projeto será hospedado online. O desktop de quem desenvolveu não precisará permanecer ligado.

## Componentes

### Aplicação

- Next.js/React em runtime compatível com Cloudflare Workers.
- Interface mobile-first e instalável como PWA em uma etapa posterior.
- Código e documentação versionados no GitHub.

### Dados

- Cloudflare D1 (SQLite gerenciado) como fonte principal dos serviços, disponibilidade, reservas, mensagens e lançamentos financeiros.
- Restrições únicas e transações para impedir reserva duplicada.
- Imagens futuras devem ser armazenadas em serviço de objetos, não diretamente no banco.

### Google Agenda

- O banco da plataforma é a fonte de verdade do agendamento.
- Uma reserva confirmada cria ou atualiza um evento no calendário dedicado.
- Eventos ocupados do Google podem ser consultados para evitar conflitos.
- Identificadores externos serão armazenados para cancelamento e sincronização segura.
- Credenciais nunca entram no Git; serão configuradas como segredos da hospedagem.

É permitido testar com a conta Google da desenvolvedora e trocar para a conta definitiva. A troca deve ser feita por configuração e nova autorização, não por alteração estrutural no código.

### WhatsApp

#### Etapa gratuita

- WhatsApp Business com saudação, ausência, respostas rápidas e link do site.
- Links `wa.me` podem abrir mensagens pré-preenchidas sem custo de API.
- Textos ficam documentados no painel, mas a saudação/ausência do aplicativo ainda é configurada no próprio WhatsApp.

#### Etapa oficial automatizada

- Integração com a WhatsApp Cloud API.
- Confirmações, lembretes e cancelamentos usam modelos aprovados quando exigido pela Meta.
- Webhooks registram entrega e respostas.
- Não usar bibliotecas que simulam o WhatsApp Web no número comercial.

## Modelo de dados planejado

- `services`: nome, descrição, preço, duração pública e nota interna.
- `weekly_availability`: intervalos do padrão semanal.
- `availability_exceptions`: abertura ou bloqueio por data e intervalo.
- `customers`: dados mínimos de contato e consentimentos.
- `appointments`: serviço, cliente, início, fim, estado e referência do Google.
- `payments`: valor, método, estado e data de recebimento.
- `message_templates`: finalidade, canal, texto e estado de aprovação.
- `settings`: identidade, políticas e configurações operacionais.
- Futuro: `products`, `inventory_movements`, `orders` e `order_items`.

## Segurança e privacidade

- Painel protegido; páginas públicas não expõem dados de clientes.
- Toda alteração administrativa deve ser autorizada no servidor.
- Coletar somente dados necessários e oferecer política de privacidade.
- Manter chaves e tokens exclusivamente em segredos da hospedagem.
- Registrar estados de pagamento, sem armazenar dados completos de cartão.
- Prever exportação e cópia de segurança para reduzir dependência do fornecedor.

