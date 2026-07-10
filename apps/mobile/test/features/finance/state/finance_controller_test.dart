import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';
import 'package:psiops_mobile/features/finance/state/finance_controller.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

void main() {
  group('FinanceController.load', () {
    test('agrupa as mensalidades do mês em foco por status com totais em centavos', () async {
      final controller = FinanceController(
        InMemoryChargeAdapter(now: fixedNow),
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();

      expect(controller.status, FinanceStatus.ready);
      expect(controller.emDiaCharges.map((c) => c.id), ['charge-mock-1']);
      expect(controller.pendenteCharges.map((c) => c.id), ['charge-mock-2']);
      expect(controller.atrasadaCharges.map((c) => c.id), ['charge-mock-3']);

      // charge-mock-1 = 25000, charge-mock-2 = 20000, charge-mock-3 = 22000
      // (seed de InMemoryChargeAdapter) — sempre em centavos inteiros.
      expect(controller.totalEmDiaCents, 25000);
      expect(controller.totalPendenteCents, 20000);
      expect(controller.totalAtrasadaCents, 22000);
      expect(controller.totalGeralCents, 67000);
      expect(controller.isEmpty, isFalse);

      expect(controller.patientName('patient-1'), 'Beatriz Andrade');
    });
  });

  group('FinanceController.markAsPaid', () {
    test('marca a mensalidade como paga e atualiza os totais imediatamente', () async {
      final controller = FinanceController(
        InMemoryChargeAdapter(now: fixedNow),
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();

      final pendingCharge = controller.pendenteCharges.single;
      final success = await controller.markAsPaid(pendingCharge, method: PaymentMethod.pix);

      expect(success, isTrue);
      expect(controller.pendenteCharges, isEmpty);
      expect(controller.emDiaCharges.map((c) => c.id), containsAll(['charge-mock-1', 'charge-mock-2']));
      expect(controller.totalPendenteCents, 0);
      expect(controller.totalEmDiaCents, 45000);
      expect(controller.totalGeralCents, 67000); // total geral não muda, só a distribuição por status
    });

    test('retorna false e popula actionErrorMessage ao tentar pagar uma mensalidade já paga', () async {
      final controller = FinanceController(
        InMemoryChargeAdapter(now: fixedNow),
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();

      final pendingCharge = controller.pendenteCharges.single;
      await controller.markAsPaid(pendingCharge, method: PaymentMethod.pix);

      final success = await controller.markAsPaid(pendingCharge, method: PaymentMethod.pix);
      expect(success, isFalse);
      expect(controller.actionErrorMessage, isNotNull);
    });
  });

  group('FinanceController.generateMonth', () {
    test('gera uma mensalidade por paciente ativo e é idempotente ao repetir', () async {
      final chargeAdapter = InMemoryChargeAdapter(now: fixedNow, seedSampleData: false);
      final controller = FinanceController(
        chargeAdapter,
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();
      expect(controller.isEmpty, isTrue);

      final firstResult = await controller.generateMonth();
      expect(firstResult.created, 3);
      expect(firstResult.skipped, 0);
      expect(await chargeAdapter.listCharges(), hasLength(3));

      // patient-1 (billingDay 5) já venceu em relação a fixedNow (dia 6) →
      // atrasada; patient-2 (dia 10) e patient-3 (dia 15) ainda não venceram
      // → pendente.
      expect(controller.atrasadaCharges.map((c) => c.patientId), ['patient-1']);
      expect(controller.pendenteCharges.map((c) => c.patientId), containsAll(['patient-2', 'patient-3']));

      // Repetir a geração para o mesmo mês não duplica nenhuma mensalidade
      // (idempotência — acceptance criteria da PSI-043).
      final secondResult = await controller.generateMonth();
      expect(secondResult.created, 0);
      expect(secondResult.skipped, 3);
      expect(await chargeAdapter.listCharges(), hasLength(3));
    });

    test('gerar o mês corrente quando já há mensalidades semeadas ignora todos os pacientes (idempotência com dados pré-existentes)', () async {
      final chargeAdapter = InMemoryChargeAdapter(now: fixedNow); // já semeado com o mês corrente
      final controller = FinanceController(
        chargeAdapter,
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();

      final result = await controller.generateMonth();
      expect(result.created, 0);
      expect(result.skipped, 3);
      expect(await chargeAdapter.listCharges(), hasLength(3));
    });
  });

  group('FinanceController — navegação entre meses', () {
    test('goToNextMonth/goToPreviousMonth avançam/retrocedem o mês em foco e recarregam', () async {
      final controller = FinanceController(
        InMemoryChargeAdapter(now: fixedNow),
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();
      expect(controller.focusedMonth, DateTime(2026, 7, 1));
      expect(controller.isEmpty, isFalse);

      await controller.goToNextMonth();
      expect(controller.focusedMonth, DateTime(2026, 8, 1));
      expect(controller.focusedCompetence, '2026-08');
      expect(controller.isEmpty, isTrue); // nenhuma mensalidade gerada para agosto

      await controller.goToPreviousMonth();
      expect(controller.focusedMonth, DateTime(2026, 7, 1));
      expect(controller.isEmpty, isFalse);
    });

    test('goToCurrentMonth volta ao mês corrente a partir de qualquer navegação', () async {
      final controller = FinanceController(
        InMemoryChargeAdapter(now: fixedNow),
        InMemoryPatientsAdapter(now: fixedNow),
        now: fixedNow,
      );
      await controller.load();
      await controller.goToNextMonth();
      await controller.goToNextMonth();

      await controller.goToCurrentMonth();
      expect(controller.focusedMonth, DateTime(2026, 7, 1));
      expect(controller.isEmpty, isFalse);
    });
  });
}
