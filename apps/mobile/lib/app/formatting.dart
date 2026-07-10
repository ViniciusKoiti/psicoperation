// Formatação pt-BR e utilidades de data/hora usadas pelo dashboard, pela
// agenda e pela feature de pacientes.
//
// Datas e horários trafegam em ISO 8601 nas bordas dos adapters (modelos
// gerados de `packages/contracts/gen/dart`); estas funções entram apenas na
// camada de apresentação, convertendo para o formato lido pela psicóloga
// brasileira. Implementadas manualmente (sem o pacote `intl`) porque só é
// preciso formatar dígitos (`dd/MM/yyyy`, `HH:mm`) e uma tabela fixa de
// nomes de dia da semana em português — não há necessidade dos dados de
// locale (mês por extenso, plurais etc.) que justificariam adicionar uma
// dependência nova (`intl` já é transitiva via `psiops_contracts`, mas usá-
// la para isto seria uma dependência não declarada e desnecessária).

import 'package:psiops_contracts/api.dart';

String _two(int n) => n.toString().padLeft(2, '0');

/// Formata uma data como `dd/MM/yyyy`.
String formatDatePtBr(DateTime date) =>
    '${_two(date.day)}/${_two(date.month)}/${date.year}';

/// Formata um horário como `HH:mm`.
String formatTimePtBr(DateTime date) => '${_two(date.hour)}:${_two(date.minute)}';

/// Formata data e horário como `dd/MM/yyyy HH:mm`.
String formatDateTimePtBr(DateTime date) =>
    '${formatDatePtBr(date)} ${formatTimePtBr(date)}';

/// Remove o componente de hora de [date], mantendo apenas o dia civil — útil
/// para comparar "mesmo dia" e para navegar a agenda por dia/semana.
DateTime dateOnly(DateTime date) => DateTime(date.year, date.month, date.day);

/// Indica se [a] e [b] caem no mesmo dia civil.
bool isSameDate(DateTime a, DateTime b) {
  final da = dateOnly(a);
  final db = dateOnly(b);
  return da.year == db.year && da.month == db.month && da.day == db.day;
}

/// Início (segunda-feira) da semana civil que contém [date].
DateTime startOfWeek(DateTime date) {
  final day = dateOnly(date);
  return day.subtract(Duration(days: day.weekday - DateTime.monday));
}

String _four(int n) => n.toString().padLeft(4, '0');

/// Formata um mês/ano como a competência `AAAA-MM` usada pelo contrato de
/// cobranças (`Charge.competence`, `CreateChargeRequest.competence`) — ver
/// `packages/contracts/openapi/components/billing/schemas.yaml#/Competence`.
/// Só os componentes de ano/mês de [month] importam (o dia é ignorado).
String competenceOf(DateTime month) => '${_four(month.year)}-${_two(month.month)}';

/// Mês civil imediatamente anterior ao de [month] (mesmo dia 1, sem
/// depender do número de dias do mês anterior) — usado pela navegação entre
/// meses da tela financeira.
DateTime previousMonth(DateTime month) =>
    month.month == 1 ? DateTime(month.year - 1, 12, 1) : DateTime(month.year, month.month - 1, 1);

/// Mês civil imediatamente seguinte ao de [month] — contraparte de
/// [previousMonth].
DateTime nextMonth(DateTime month) =>
    month.month == 12 ? DateTime(month.year + 1, 1, 1) : DateTime(month.year, month.month + 1, 1);

const List<String> _monthLabelsPtBr = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/// Rótulo pt-BR de um mês/ano (ex.: `"julho de 2026"`) — usado no cabeçalho
/// de navegação mensal da tela financeira. Tabela fixa (mesma justificativa
/// de não usar `intl` documentada no topo deste arquivo).
String monthLabelPtBr(DateTime month) => '${_monthLabelsPtBr[month.month - 1]} de ${month.year}';

const List<String> _weekdayLabelsShort = [
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
  'Dom',
];

const List<String> _weekdayLabelsLong = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

/// Abreviação pt-BR do dia da semana (`Seg`, `Ter`, ...) — usada nos
/// cabeçalhos da visão semanal.
String weekdayLabelShort(DateTime date) => _weekdayLabelsShort[date.weekday - 1];

/// Nome completo pt-BR do dia da semana — usado no seletor de recorrência.
String weekdayLabelLong(DateTime date) => _weekdayLabelsLong[date.weekday - 1];

/// Formata um valor inteiro em centavos BRL como `R$ 1.234,56`
/// (separador de milhar `.`, separador decimal `,`, pt-BR). Nunca recebe
/// ponto flutuante — a aritmética monetária do app inteiro é sobre centavos
/// inteiros (regra invariável do CLAUDE.md).
String formatCentsBRL(int cents) {
  final negative = cents < 0;
  final absCents = cents.abs();
  final reais = absCents ~/ 100;
  final centavos = absCents % 100;
  final reaisDigits = reais.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < reaisDigits.length; i++) {
    final remaining = reaisDigits.length - i;
    if (i > 0 && remaining % 3 == 0) buffer.write('.');
    buffer.write(reaisDigits[i]);
  }
  final sign = negative ? '-' : '';
  return '$sign'
      'R\$ $buffer,${_two(centavos)}';
}

/// Rótulo pt-BR de [AppointmentStatus] para exibição na UI.
String appointmentStatusLabel(AppointmentStatus status) {
  if (status == AppointmentStatus.agendada) return 'Agendada';
  if (status == AppointmentStatus.realizada) return 'Realizada';
  if (status == AppointmentStatus.cancelada) return 'Cancelada';
  if (status == AppointmentStatus.remarcada) return 'Remarcada';
  return status.value;
}

/// Rótulo pt-BR de [ChargeStatus] para exibição na UI.
String chargeStatusLabel(ChargeStatus status) {
  if (status == ChargeStatus.emDia) return 'Em dia';
  if (status == ChargeStatus.pendente) return 'Pendente';
  if (status == ChargeStatus.atrasada) return 'Atrasada';
  return status.value;
}

/// Rótulo pt-BR de [PaymentMethod] para exibição na UI.
String paymentMethodLabel(PaymentMethod method) {
  if (method == PaymentMethod.pix) return 'Pix';
  if (method == PaymentMethod.dinheiro) return 'Dinheiro';
  if (method == PaymentMethod.transferencia) return 'Transferência';
  if (method == PaymentMethod.cartao) return 'Cartão';
  if (method == PaymentMethod.outro) return 'Outro';
  return method.value;
}

/// Rótulo pt-BR de [PatientStatus] para exibição na UI.
String patientStatusLabel(PatientStatus status) {
  if (status == PatientStatus.ativo) return 'Ativo';
  if (status == PatientStatus.inativo) return 'Arquivado';
  return status.value;
}

/// Rótulo pt-BR de [AttendanceStatus] (registro administrativo de presença —
/// NUNCA dado clínico) para exibição na UI.
String attendanceStatusLabel(AttendanceStatus status) {
  if (status == AttendanceStatus.compareceu) return 'Compareceu';
  if (status == AttendanceStatus.faltou) return 'Faltou';
  if (status == AttendanceStatus.remarcada) return 'Remarcada';
  return status.value;
}

/// Converte uma entrada de texto pt-BR (ex.: `"150,00"`, `"150"`,
/// `"1.234,56"`) em centavos inteiros. Retorna `null` se [input] não puder
/// ser interpretado como um valor monetário válido — usado pela validação do
/// formulário de paciente (mensagens de erro em pt-BR ficam a cargo do
/// chamador). Nunca passa por `double`: o resultado é sempre um inteiro em
/// centavos (regra invariável do CLAUDE.md).
int? parseCentsFromBRLInput(String input) {
  final trimmed = input.trim();
  if (trimmed.isEmpty) return null;
  final cleaned = trimmed.replaceAll('.', '');
  final parts = cleaned.split(',');
  if (parts.isEmpty || parts.length > 2) return null;

  final reaisPart = parts[0];
  if (reaisPart.isEmpty || !RegExp(r'^\d+$').hasMatch(reaisPart)) return null;

  var centavosPart = parts.length == 2 ? parts[1] : '00';
  if (!RegExp(r'^\d{1,2}$').hasMatch(centavosPart)) return null;
  if (centavosPart.length == 1) centavosPart = '${centavosPart}0';

  final reais = int.parse(reaisPart);
  final centavos = int.parse(centavosPart);
  return reais * 100 + centavos;
}

/// Formata centavos como texto editável pt-BR sem o prefixo `R$` (ex.:
/// `15000` → `"150,00"`) — usado para preencher o campo de valor da
/// mensalidade ao editar um paciente existente. Contraparte de
/// [parseCentsFromBRLInput].
String centsToBRLInput(int cents) {
  final reais = cents ~/ 100;
  final centavos = cents % 100;
  return '$reais,${centavos.toString().padLeft(2, '0')}';
}
