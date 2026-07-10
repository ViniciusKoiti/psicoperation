/// Validação inline (pt-BR) e conversões auxiliares do formulário de
/// cadastro/edição de paciente — consistentes com as restrições dos
/// contratos (`packages/contracts/openapi/components/patient/schemas.yaml`,
/// refletidas nos modelos Dart de `packages/contracts/gen/dart`):
/// `name` (1–120 caracteres), `email` (formato de e-mail, opcional),
/// `whatsapp` (E.164 brasileiro `+55DDD9XXXXXXXX`, opcional),
/// `monthlyFee` (centavos BRL, > 0) e `billingDay` (1–28).
library;

import '../../../app/formatting.dart';

final RegExp _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// Nome é obrigatório (`Patient.name`: 1–120 caracteres).
String? validatePatientName(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return 'Informe o nome do paciente.';
  if (trimmed.length > 120) {
    return 'O nome pode ter no máximo 120 caracteres.';
  }
  return null;
}

/// WhatsApp é opcional (`Patient.whatsapp`); quando preenchido, precisa ter
/// DDD (2 dígitos, nenhum começando em 0) + `9` + 8 dígitos — 11 dígitos no
/// total, o mesmo formato validado por `WhatsAppBR` no contrato antes de
/// normalizar para E.164 (ver [whatsappToE164]).
String? validatePatientWhatsapp(String? value) {
  final digits = _digitsOnly(value);
  if (digits.isEmpty) return null;
  if (digits.length != 11) {
    return 'Informe um WhatsApp válido com DDD (11 dígitos).';
  }
  if (digits[0] == '0' || digits[1] == '0') return 'DDD inválido.';
  if (digits[2] != '9') {
    return 'Número de celular deve ter 9 dígitos, começando com 9 após o DDD.';
  }
  return null;
}

/// E-mail é opcional (`Patient.email`); quando preenchido, precisa ter
/// formato válido e no máximo 254 caracteres.
String? validatePatientEmail(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return null;
  if (trimmed.length > 254 || !_emailPattern.hasMatch(trimmed)) {
    return 'Informe um e-mail válido.';
  }
  return null;
}

/// Valor da mensalidade é obrigatório e precisa ser um valor monetário
/// pt-BR válido e maior que zero (`Patient.monthlyFee`: centavos BRL).
String? validatePatientMonthlyFee(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return 'Informe o valor da mensalidade.';
  final cents = parseCentsFromBRLInput(trimmed);
  if (cents == null) {
    return 'Informe um valor monetário válido (ex.: 150,00).';
  }
  if (cents <= 0) return 'O valor da mensalidade deve ser maior que zero.';
  return null;
}

/// Dia de vencimento é obrigatório e precisa estar entre 1 e 28
/// (`Patient.billingDay`).
String? validatePatientBillingDay(int? value) {
  if (value == null) return 'Informe o dia de vencimento.';
  if (value < 1 || value > 28) {
    return 'O dia de vencimento deve estar entre 1 e 28.';
  }
  return null;
}

/// Anotações administrativas são opcionais, até 2000 caracteres
/// (`Patient.notes`) — NUNCA conteúdo clínico (restrição de produto
/// inviolável; a UI reforça isso via texto de ajuda, não validação).
String? validatePatientNotes(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.length > 2000) {
    return 'A anotação pode ter no máximo 2000 caracteres.';
  }
  return null;
}

String _digitsOnly(String? value) => (value ?? '').replaceAll(RegExp(r'[^0-9]'), '');

/// Converte o WhatsApp mascarado (`(XX) XXXXX-XXXX`, ou qualquer texto com
/// os mesmos 11 dígitos) para o formato canônico E.164 (`+55XXXXXXXXXXX`)
/// esperado pelos contratos. Retorna `null` se [value] estiver vazio (campo
/// opcional) — chamar apenas após [validatePatientWhatsapp] não acusar erro.
String? whatsappToE164(String? value) {
  final digits = _digitsOnly(value);
  if (digits.isEmpty) return null;
  return '+55$digits';
}

/// Extrai o DDD+número (11 dígitos, sem o prefixo `+55`) de um WhatsApp em
/// E.164 para preencher o campo mascarado ao editar um paciente existente.
/// Contraparte de [whatsappToE164].
String whatsappFromE164ForInput(String value) {
  final digits = _digitsOnly(value);
  if (digits.length == 13 && digits.startsWith('55')) {
    return digits.substring(2);
  }
  return digits;
}

/// Formata um WhatsApp em E.164 (`+5511990000000`) como `(11) 99000-0000`
/// para exibição no detalhe do paciente. Retorna o valor original se não
/// tiver o formato E.164 brasileiro esperado.
String formatWhatsappForDisplay(String value) {
  final local = whatsappFromE164ForInput(value);
  if (local.length != 11) return value;
  return '(${local.substring(0, 2)}) ${local.substring(2, 7)}-${local.substring(7, 11)}';
}
