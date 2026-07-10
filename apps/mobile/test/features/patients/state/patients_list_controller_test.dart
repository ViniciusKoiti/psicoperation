import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';
import 'package:psiops_mobile/features/patients/state/patients_list_controller.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

void main() {
  group('PatientsListController', () {
    test('carrega pacientes ativos por padrão', () async {
      final controller = PatientsListController(InMemoryPatientsAdapter(now: fixedNow));
      await controller.load();

      expect(controller.status, PatientsListStatus.ready);
      expect(controller.patients.map((p) => p.name), containsAll([
        'Beatriz Andrade',
        'Carlos Eduardo Lima',
        'Daniela Souza',
      ]));
    });

    test('busca por nome filtra a lista carregada, sem diferenciar maiúsculas/minúsculas', () async {
      final controller = PatientsListController(InMemoryPatientsAdapter(now: fixedNow));
      await controller.load();

      controller.setQuery('carlos');
      expect(controller.patients, hasLength(1));
      expect(controller.patients.single.name, 'Carlos Eduardo Lima');

      controller.setQuery('');
      expect(controller.patients, hasLength(3));

      controller.setQuery('paciente que não existe');
      expect(controller.patients, isEmpty);
    });

    test('showArchivedPatients troca para a lista de arquivados', () async {
      final adapter = InMemoryPatientsAdapter(now: fixedNow);
      await adapter.archivePatient('patient-2');
      final controller = PatientsListController(adapter);
      await controller.load();

      expect(controller.patients.map((p) => p.name), isNot(contains('Carlos Eduardo Lima')));

      await controller.showArchivedPatients();
      expect(controller.showArchived, isTrue);
      expect(controller.patients.map((p) => p.name), contains('Carlos Eduardo Lima'));

      await controller.showActivePatients();
      expect(controller.showArchived, isFalse);
      expect(controller.patients.map((p) => p.name), isNot(contains('Carlos Eduardo Lima')));
    });
  });
}
