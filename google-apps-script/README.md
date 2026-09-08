# Conectar o Google Agenda da Magia Selenne

Esta é uma ponte privada: o site só a usa quando a reserva estiver marcada como **Confirmada** e **Pago** no painel. Nascimento não é enviado ao calendário.

1. Entre em `https://script.google.com` com `contato.joycemagia@gmail.com` e crie um projeto.
2. Cole o conteúdo de `Code.gs` no editor e salve.
3. Em **Configurações do projeto > Propriedades do script**, adicione:
   - `CALENDAR_ID`: `primary`
   - `BRIDGE_SECRET`: uma senha longa e exclusiva (guarde-a; ela também será colocada como segredo do site).
4. Use **Implantar > Nova implantação > Aplicativo da Web**. Escolha executar como a Joyce e permita acesso para qualquer pessoa. A senha acima mantém a ponte fechada ao site.
5. Copie a URL terminada em `/exec`. Ela e a senha serão configuradas como segredos do site, nunca exibidos ao público.

Depois de conectada, confirmar + marcar como pago cria o evento privado. Cancelar ou marcar ausência remove-o. As reservas de teste atuais não serão enviadas até que você as confirme e marque como pagas.
