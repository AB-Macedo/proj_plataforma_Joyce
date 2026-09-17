# Magia Theia — plataforma de atendimentos

Plataforma pública de agendamento e painel administrativo para os atendimentos online da Magia Theia. O objetivo é reduzir o trabalho manual no WhatsApp sem perder o cuidado com cada cliente.

## O que já está funcionando

- Site público responsivo, com catálogo, agenda e formulário de reserva.
- Painel administrativo protegido em `/painel`, utilizável no celular.
- Grade semanal, abertura e bloqueio de datas específicas e limite diário de atendimento.
- Reservas, clientes, filtros por período, clientes recorrentes e status de pagamento.
- Selo para clientes que solicitaram fotos das cartas e feedback privado no painel.
- Sincronização com Google Agenda quando uma reserva está confirmada e paga.
- Catálogo de serviços: editar serviços existentes, pausar/reativar temporariamente e criar novos registros pelo painel.

## Serviços e pagamentos

- Serviços pausados preservam o histórico, mas deixam de aceitar novas reservas.
- Nome, descrição, duração e valores podem ser ajustados pelo painel.
- Novos serviços ficam registrados no catálogo administrativo. A exibição automática de serviços totalmente novos no fluxo público de agendamento é uma próxima melhoria; os serviços iniciais já estão conectados.
- Hoje a cliente é encaminhada ao WhatsApp com uma mensagem pronta para combinar o Pix e enviar comprovante. A próxima evolução planejada é QR Code Pix automático via intermediário de pagamento.

## Disponibilidade semanal padrão

| Dia | Horário |
| --- | --- |
| Segunda | 13h–19h |
| Terça | 13h–19h |
| Quarta | sem atendimento |
| Quinta | 13h–19h |
| Sexta | 12h–15h |
| Sábado | 13h–19h |
| Domingo | sem atendimento |

O painel permite substituir esses horários, pausar dias e cadastrar pausas ou horários extras em datas específicas.

## Publicação e propriedade

O piloto está publicado em ChatGPT Sites. O endereço atual pode receber um domínio próprio quando ele for registrado e apontado no DNS. Domínio, contas de pagamento, Google Agenda e futuras contas comerciais devem estar em nome da profissional.

## Documentação

- [Visão funcional](docs/VISAO_FUNCIONAL.md)
- [Arquitetura e integrações](docs/ARQUITETURA.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisões do projeto](docs/DECISOES.md)
- [Operação e manutenção](docs/OPERACAO_E_MANUTENCAO.md)
