function WhatsAppIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
    </svg>
  );
}

/**
 * Visual 2 da Solução (spec §1.4, feature "Lembretes automáticos pelo
 * WhatsApp"): mock de conversa — header com ícone + remetente/horário e
 * balão de mensagem com recibo de entrega. Conteúdo idêntico à referência.
 */
export function WhatsAppMock() {
  return (
    <div className="psi-whatsapp" data-testid="whatsapp-mock">
      <div className="psi-whatsapp__header">
        <span className="psi-whatsapp__avatar">
          <WhatsAppIcon />
        </span>
        <div>
          <p className="psi-whatsapp__from">PsiOps · Lembrete</p>
          <p className="psi-whatsapp__time">hoje, 09:02</p>
        </div>
      </div>
      <div className="psi-whatsapp__bubble">
        <p className="psi-whatsapp__message">
          Olá Marcos, sua mensalidade de <strong>R$ 350</strong> vence em <strong>3 dias</strong>.
          Segue o link para pagamento. 💜
        </p>
        <p className="psi-whatsapp__receipt">Entregue ✓✓</p>
      </div>
    </div>
  );
}
