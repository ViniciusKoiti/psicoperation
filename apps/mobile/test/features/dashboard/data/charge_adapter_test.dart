import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

void main() {
  group('InMemoryChargeAdapter.createCharge', () {
    test('emite uma cobrança nova para o par paciente/competência', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow, seedSampleData: false);

      final charge = await adapter.createCharge(
        CreateChargeRequest(
          patientId: 'patient-9',
          competence: '2026-07',
          amount: 18000,
          dueDate: DateTime(2026, 7, 20),
        ),
      );

      expect(charge.patientId, 'patient-9');
      expect(charge.competence, '2026-07');
      expect(charge.amount, 18000);
      expect(charge.status, ChargeStatus.pendente);
      expect(charge.payment, isNull);

      final all = await adapter.listCharges();
      expect(all, hasLength(1));
    });

    test('classifica como atrasada quando o vencimento já passou', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow, seedSampleData: false);

      final charge = await adapter.createCharge(
        CreateChargeRequest(
          patientId: 'patient-9',
          competence: '2026-07',
          amount: 18000,
          // fixedNow() é 2026-07-06; vencimento dia 1 já passou.
          dueDate: DateTime(2026, 7, 1),
        ),
      );

      expect(charge.status, ChargeStatus.atrasada);
    });

    test('é idempotente: repetir paciente/competência lança ChargeAlreadyExistsException sem duplicar', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow, seedSampleData: false);

      await adapter.createCharge(
        CreateChargeRequest(
          patientId: 'patient-9',
          competence: '2026-07',
          amount: 18000,
          dueDate: DateTime(2026, 7, 20),
        ),
      );

      await expectLater(
        adapter.createCharge(
          CreateChargeRequest(
            patientId: 'patient-9',
            competence: '2026-07',
            amount: 99999,
            dueDate: DateTime(2026, 7, 25),
          ),
        ),
        throwsA(isA<ChargeAlreadyExistsException>()),
      );

      final all = await adapter.listCharges();
      expect(all, hasLength(1));
      expect(all.single.amount, 18000);
    });

    test('permite o mesmo paciente em competências diferentes', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow, seedSampleData: false);

      await adapter.createCharge(
        CreateChargeRequest(
          patientId: 'patient-9',
          competence: '2026-06',
          amount: 18000,
          dueDate: DateTime(2026, 6, 20),
        ),
      );
      await adapter.createCharge(
        CreateChargeRequest(
          patientId: 'patient-9',
          competence: '2026-07',
          amount: 18000,
          dueDate: DateTime(2026, 7, 20),
        ),
      );

      final all = await adapter.listCharges();
      expect(all, hasLength(2));
    });
  });

  group('InMemoryChargeAdapter.registerPayment', () {
    test('marca a cobrança seedada como em_dia e preenche o pagamento', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow);

      final updated = await adapter.registerPayment(
        'charge-mock-2',
        RegisterPaymentRequest(
          paidAmount: 20000,
          paidAt: fixedNow(),
          method: PaymentMethod.pix,
        ),
      );

      expect(updated.status, ChargeStatus.emDia);
      expect(updated.payment, isNotNull);
      expect(updated.payment!.paidAmount, 20000);
      expect(updated.payment!.method, PaymentMethod.pix);
    });

    test('lança ChargeNotFoundException para id inexistente', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow);

      await expectLater(
        adapter.registerPayment(
          'charge-inexistente',
          RegisterPaymentRequest(paidAmount: 100, paidAt: fixedNow(), method: PaymentMethod.pix),
        ),
        throwsA(isA<ChargeNotFoundException>()),
      );
    });

    test('lança ChargeAlreadyPaidException ao tentar pagar de novo', () async {
      final adapter = InMemoryChargeAdapter(now: fixedNow);

      await adapter.registerPayment(
        'charge-mock-2',
        RegisterPaymentRequest(paidAmount: 20000, paidAt: fixedNow(), method: PaymentMethod.pix),
      );

      await expectLater(
        adapter.registerPayment(
          'charge-mock-2',
          RegisterPaymentRequest(paidAmount: 20000, paidAt: fixedNow(), method: PaymentMethod.pix),
        ),
        throwsA(isA<ChargeAlreadyPaidException>()),
      );
    });
  });
}
