# Operação e manutenção

## Contas e propriedade

- Criar o e-mail definitivo após a escolha da marca.
- Registrar domínio e contas comerciais em nome da profissional.
- Usar gerenciador de senhas e autenticação em dois fatores.
- Manter pelo menos um administrador de recuperação confiável.
- Nunca salvar senhas, tokens ou chaves no repositório.

## Troca do e-mail de teste

O e-mail da desenvolvedora poderá ser usado para validar o Google Agenda. Para migrar:

1. Criar a conta definitiva.
2. Criar ou transferir o calendário comercial.
3. Autorizar a nova conta na integração.
4. Trocar as referências configuráveis do calendário.
5. Executar uma reserva de teste, um reagendamento e um cancelamento.
6. Remover o acesso da conta antiga quando tudo estiver validado.

## Rotina sugerida

- Semanal: publicar disponibilidade da semana seguinte.
- Diária: conferir consultas e pagamentos pendentes.
- Mensal: exportar caixa e revisar indicadores.
- Trimestral: revisar usuários, integrações e permissões.
- Antes de grandes mudanças: gerar backup/exportação e registrar a alteração.

## Catálogo de serviços

- Para editar, pausar ou excluir um atendimento, abrir **Serviços** no painel e tocar no card correspondente.
- Pausar não exclui o serviço nem apaga reservas antigas; é indicado para férias, pausa temporária ou teste de formato.
- Excluir retira o serviço do catálogo e do site, mas preserva as reservas antigas no histórico.
- Para criar um atendimento, usar **Adicionar serviço** e preencher nome, descrição, preço e duração.
- Serviços ativos criados pelo painel aparecem automaticamente no fluxo público de agendamento.

## Manutenibilidade

- Alterações operacionais comuns devem ocorrer pelo painel, não no código.
- Integrações externas devem ficar isoladas em módulos substituíveis.
- O projeto deve ter instruções atualizadas de desenvolvimento e publicação.
- Mudanças no banco devem usar migrações versionadas.
- Dependências devem ser atualizadas em ciclos controlados e testados.
