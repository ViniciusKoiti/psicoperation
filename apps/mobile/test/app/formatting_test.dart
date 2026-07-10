import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/app/formatting.dart';

// Cobre apenas as funções adicionadas na PSI-043 (competência/navegação
// mensal e rótulo de meio de pagamento) — as demais funções deste arquivo já
// são exercitadas indiretamente pelos testes de agenda/pacientes/dashboard
// (PSI-040/041/042).
void main() {
  group('competenceOf', () {
    test('formata ano-mês com zero à esquerda', () {
      expect(competenceOf(DateTime(2026, 7, 15)), '2026-07');
      expect(competenceOf(DateTime(2026, 1, 1)), '2026-01');
    });
  });

  group('previousMonth/nextMonth', () {
    test('navega dentro do mesmo ano', () {
      expect(previousMonth(DateTime(2026, 7, 1)), DateTime(2026, 6, 1));
      expect(nextMonth(DateTime(2026, 7, 1)), DateTime(2026, 8, 1));
    });

    test('vira o ano corretamente na virada de dezembro/janeiro', () {
      expect(previousMonth(DateTime(2026, 1, 1)), DateTime(2025, 12, 1));
      expect(nextMonth(DateTime(2026, 12, 1)), DateTime(2027, 1, 1));
    });
  });

  group('monthLabelPtBr', () {
    test('formata mês por extenso em pt-BR', () {
      expect(monthLabelPtBr(DateTime(2026, 7, 1)), 'julho de 2026');
      expect(monthLabelPtBr(DateTime(2026, 1, 1)), 'janeiro de 2026');
      expect(monthLabelPtBr(DateTime(2026, 12, 1)), 'dezembro de 2026');
    });
  });

  group('paymentMethodLabel', () {
    test('traduz cada meio de pagamento para pt-BR', () {
      expect(paymentMethodLabel(PaymentMethod.pix), 'Pix');
      expect(paymentMethodLabel(PaymentMethod.dinheiro), 'Dinheiro');
      expect(paymentMethodLabel(PaymentMethod.transferencia), 'Transferência');
      expect(paymentMethodLabel(PaymentMethod.cartao), 'Cartão');
      expect(paymentMethodLabel(PaymentMethod.outro), 'Outro');
    });
  });
}
