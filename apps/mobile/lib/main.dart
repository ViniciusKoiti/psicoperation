import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import 'app/app.dart';
import 'app/env.dart';

/// Entrypoint do app companion do PsiOps.
///
/// O ambiente é resolvido de `--dart-define=PSIOPS_ENV` ([AppEnvironment]);
/// o default é `dev` (mocks em memória). Não há flavors nativos no MVP —
/// decisão registrada em `app/env.dart`.
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  _registerFontLicenses();
  runApp(PsiOpsApp(environment: AppEnvironment.fromDartDefine()));
}

/// Registra as licenças OFL das fontes embarcadas (DM Sans, Inter, Fraunces)
/// no [LicenseRegistry], para que apareçam na tela "Licenças" do app.
void _registerFontLicenses() {
  LicenseRegistry.addLicense(() async* {
    for (final entry in const {
      'DM Sans': 'assets/fonts/OFL-DMSans.txt',
      'Inter': 'assets/fonts/OFL-Inter.txt',
      'Fraunces': 'assets/fonts/OFL-Fraunces.txt',
    }.entries) {
      try {
        final license = await rootBundle.loadString(entry.value);
        yield LicenseEntryWithLineBreaks([entry.key], license);
      } catch (error) {
        // Não bloquear o boot por falha ao ler uma licença de fonte.
        debugPrint('Falha ao registrar licença de ${entry.key}: $error');
      }
    }
  });
}
