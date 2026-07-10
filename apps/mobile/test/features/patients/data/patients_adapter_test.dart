import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

void main() {
  group('InMemoryPatientsAdapter', () {
    test('listPatients lista todos os pacientes semeados (compat. com PatientLookupAdapter)', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);
      final patients = await adapter.listPatients();
      expect(patients.map((p) => p.name), containsAll(['Beatriz Andrade', 'Carlos Eduardo Lima', 'Daniela Souza']));
    });

    test('listPatientsByStatus filtra por status', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);

      final active = await adapter.listPatientsByStatus(PatientStatus.ativo);
      expect(active, hasLength(3));

      final archived = await adapter.listPatientsByStatus(PatientStatus.inativo);
      expect(archived, isEmpty);
    });

    test('getPatient retorna o paciente e lança PatientNotFoundException se não existir', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);

      final patient = await adapter.getPatient('patient-1');
      expect(patient.name, 'Beatriz Andrade');

      await expectLater(
        adapter.getPatient('patient-inexistente'),
        throwsA(isA<PatientNotFoundException>()),
      );
    });

    test('createPatient cadastra com status ativo e id novo', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);

      final created = await adapter.createPatient(
        PatientCreateRequest(
          name: 'Fernanda Lima',
          monthlyFee: 18000,
          billingDay: 20,
        ),
      );

      expect(created.status, PatientStatus.ativo);
      expect(created.name, 'Fernanda Lima');
      expect(created.id, isNot(anyOf('patient-1', 'patient-2', 'patient-3')));

      final active = await adapter.listPatientsByStatus(PatientStatus.ativo);
      expect(active.map((p) => p.name), contains('Fernanda Lima'));
    });

    test('updatePatient altera somente os campos presentes na requisição', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);

      final updated = await adapter.updatePatient(
        'patient-2',
        PatientUpdateRequest(monthlyFee: 30000),
      );

      expect(updated.monthlyFee, 30000);
      expect(updated.name, 'Carlos Eduardo Lima');
      expect(updated.billingDay, 10);
    });

    test('updatePatient lança PatientNotFoundException se o paciente não existir', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);
      await expectLater(
        adapter.updatePatient('patient-inexistente', PatientUpdateRequest(name: 'X')),
        throwsA(isA<PatientNotFoundException>()),
      );
    });

    test('archivePatient marca status inativo preservando os demais dados', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);

      await adapter.archivePatient('patient-3');

      final archived = await adapter.getPatient('patient-3');
      expect(archived.status, PatientStatus.inativo);
      expect(archived.name, 'Daniela Souza');
      expect(archived.monthlyFee, 22000);

      final active = await adapter.listPatientsByStatus(PatientStatus.ativo);
      expect(active.map((p) => p.id), isNot(contains('patient-3')));

      final archivedList = await adapter.listPatientsByStatus(PatientStatus.inativo);
      expect(archivedList.map((p) => p.id), contains('patient-3'));
    });

    test('listAdministrativeRecords retorna os registros semeados, mais recentes primeiro', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);

      final records = await adapter.listAdministrativeRecords('patient-1');
      expect(records, hasLength(2));
      expect(records.first.attendance, AttendanceStatus.compareceu);
      expect(records.last.attendance, AttendanceStatus.remarcada);
      expect(records.first.recordedAt!.isAfter(records.last.recordedAt!), isTrue);
    });

    test('listAdministrativeRecords retorna vazio para paciente sem registros', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);
      final records = await adapter.listAdministrativeRecords('patient-3');
      expect(records, isEmpty);
    });
  });
}
