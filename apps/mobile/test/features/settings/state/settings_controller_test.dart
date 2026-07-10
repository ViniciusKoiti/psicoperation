import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/features/home/data/profile_repository.dart';
import 'package:psiops_mobile/features/settings/data/settings_adapter.dart';
import 'package:psiops_mobile/features/settings/state/settings_controller.dart';

void main() {
  group('SettingsController.load', () {
    test('carrega perfil, configurações da conta e preferências de lembrete', () async {
      final controller = SettingsController(InMemoryProfileRepository(), InMemorySettingsAdapter());
      await controller.load();

      expect(controller.status, SettingsStatus.ready);
      expect(controller.user?.name, 'Dra. Ana Prado');
      expect(controller.accountSettings?.defaultMonthlyFee, 20000);
      expect(controller.reminderPreferences?.enabled, isTrue);
      expect(controller.reminderPreferences?.daysBefore, 3);
    });
  });

  group('SettingsController.saveProfileName', () {
    test('atualiza o nome de exibição e reflete em user', () async {
      final controller = SettingsController(InMemoryProfileRepository(), InMemorySettingsAdapter());
      await controller.load();

      final success = await controller.saveProfileName('Dra. Ana Paula Prado');
      expect(success, isTrue);
      expect(controller.user?.name, 'Dra. Ana Paula Prado');
    });
  });

  group('SettingsController.saveDefaultSessionFee', () {
    test('persiste o valor padrão de sessão em centavos inteiros (nunca ponto flutuante)', () async {
      final settingsAdapter = InMemorySettingsAdapter();
      final controller = SettingsController(InMemoryProfileRepository(), settingsAdapter);
      await controller.load();

      final success = await controller.saveDefaultSessionFee(18050);
      expect(success, isTrue);
      expect(controller.accountSettings?.defaultMonthlyFee, 18050);

      // Persistiu no adapter, não só no estado local do controller.
      final reloaded = await settingsAdapter.getSettings();
      expect(reloaded.defaultMonthlyFee, 18050);
    });
  });

  group('SettingsController.saveReminderPreferences', () {
    test('persiste ligar/desligar e antecedência em dias', () async {
      final settingsAdapter = InMemorySettingsAdapter();
      final controller = SettingsController(InMemoryProfileRepository(), settingsAdapter);
      await controller.load();

      final success = await controller.saveReminderPreferences(enabled: false, daysBefore: 5);
      expect(success, isTrue);
      expect(controller.reminderPreferences?.enabled, isFalse);
      expect(controller.reminderPreferences?.daysBefore, 5);

      final reloaded = await settingsAdapter.getReminderPreferences();
      expect(reloaded.enabled, isFalse);
      expect(reloaded.daysBefore, 5);
    });
  });
}
