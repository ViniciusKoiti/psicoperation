import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/agenda/data/in_memory_appointment_adapter.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';
import 'package:psiops_mobile/features/patients/state/patient_detail_controller.dart';

// Segunda-feira fixa, mesma referência usada pelos testes de agenda/dashboard
// (alinha com os seeds do InMemoryAppointmentAdapter/InMemoryChargeAdapter).
DateTime fixedNow() => DateTime(2026, 7, 6, 8);

void main() {
  group('PatientDetailController', () {
    test('agrega dados cadastrais, histórico de consultas, registros administrativos e financeiro', () async {
      final controller = PatientDetailController(
        InMemoryPatientsAdapter(now: fixedNow),
        InMemoryAppointmentAdapter(now: fixedNow),
        InMemoryChargeAdapter(now: fixedNow),
        'patient-1',
        now: fixedNow,
      );

      await controller.load();

      expect(controller.status, PatientDetailStatus.ready);
      expect(controller.patient?.name, 'Beatriz Andrade');

      // InMemoryAppointmentAdapter semeia uma consulta hoje 09:00 para
      // patient-1; a janela do controller cobre o passado/futuro amplo.
      expect(controller.appointmentHistory, isNotEmpty);
      expect(controller.appointmentHistory.every((a) => a.patientId == 'patient-1'), isTrue);

      // InMemoryPatientsAdapter semeia 2 registros administrativos para
      // patient-1, mais recente primeiro.
      expect(controller.administrativeRecords, hasLength(2));
      expect(controller.administrativeRecords.first.attendance, AttendanceStatus.compareceu);

      // InMemoryChargeAdapter semeia charge-mock-1 (em dia) para patient-1.
      expect(controller.charges, hasLength(1));
      expect(controller.charges.single.status, ChargeStatus.emDia);
    });

    test('marca erro quando o paciente não existe', () async {
      final controller = PatientDetailController(
        InMemoryPatientsAdapter(now: fixedNow),
        InMemoryAppointmentAdapter(now: fixedNow),
        InMemoryChargeAdapter(now: fixedNow),
        'patient-inexistente',
        now: fixedNow,
      );

      await controller.load();

      expect(controller.status, PatientDetailStatus.error);
      expect(controller.errorMessage, 'Paciente não encontrado.');
    });

    test('archive() arquiva o paciente corrente', () async {
      final patients = InMemoryPatientsAdapter(now: fixedNow);
      final controller = PatientDetailController(
        patients,
        InMemoryAppointmentAdapter(now: fixedNow),
        InMemoryChargeAdapter(now: fixedNow),
        'patient-3',
        now: fixedNow,
      );
      await controller.load();

      final success = await controller.archive();
      expect(success, isTrue);

      final archived = await patients.getPatient('patient-3');
      expect(archived.status, PatientStatus.inativo);
    });
  });
}
