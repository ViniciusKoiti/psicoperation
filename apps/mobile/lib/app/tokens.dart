import 'package:flutter/material.dart';

/// Tokens de design do PsiOps espelhados de `packages/ui/tokens.json`
/// (fonte única, derivada de `docs/design/landing-page-spec.md`).
///
/// Os valores são constantes Dart em vez de leitura de JSON em runtime para
/// manter `flutter analyze`/`flutter test` determinísticos e sem I/O. Se o
/// `tokens.json` mudar, estes valores devem ser regenerados/atualizados em
/// conjunto — a fidelidade é auditada comparando este arquivo com o JSON.
///
/// Convenção: `PsiColors.<paleta><N>` onde `N` é a escala do token
/// (`primary600` == `colors.primary["600"]`).
abstract final class PsiColors {
  // colors.primary — roxo (marca)
  static const Color primary50 = Color(0xFFF5F3FA);
  static const Color primary100 = Color(0xFFEBE7F4);
  static const Color primary200 = Color(0xFFD9D2EA);
  static const Color primary300 = Color(0xFFC0B5DC);
  static const Color primary400 = Color(0xFFA294C9);
  static const Color primary500 = Color(0xFF8676B5);
  static const Color primary600 = Color(0xFF6E5E9E);
  static const Color primary700 = Color(0xFF594C81);
  static const Color primary800 = Color(0xFF443A61);
  static const Color primary900 = Color(0xFF2F2842);

  // colors.accent — terracota
  static const Color accent50 = Color(0xFFFCF3F0);
  static const Color accent100 = Color(0xFFFAE6DF);
  static const Color accent200 = Color(0xFFF4CCBF);
  static const Color accent300 = Color(0xFFECAE9B);
  static const Color accent400 = Color(0xFFE08E75);
  static const Color accent500 = Color(0xFFD2725A);
  static const Color accent600 = Color(0xFFBC5C45);
  static const Color accent700 = Color(0xFF9C4A37);
  static const Color accent800 = Color(0xFF7A3A2C);
  static const Color accent900 = Color(0xFF532823);

  // colors.neutral — cinza quente
  static const Color neutral0 = Color(0xFFFFFFFF);
  static const Color neutral50 = Color(0xFFFAF9F7);
  static const Color neutral100 = Color(0xFFF4F2EE);
  static const Color neutral200 = Color(0xFFE9E5DF);
  static const Color neutral300 = Color(0xFFD8D2C9);
  static const Color neutral400 = Color(0xFFBAB2A6);
  static const Color neutral500 = Color(0xFF968D7F);
  static const Color neutral600 = Color(0xFF756D61);
  static const Color neutral700 = Color(0xFF595348);
  static const Color neutral800 = Color(0xFF3D3833);
  static const Color neutral900 = Color(0xFF262320);
  static const Color neutral950 = Color(0xFF181614);

  // colors.calm — teal (acento sereno)
  static const Color calmSoft = Color(0xFFDCEBE8);
  static const Color calmBase = Color(0xFF88BAB2);
  static const Color calmDeep = Color(0xFF436E68);

  // colors.error (semântico)
  static const Color errorLight = Color(0xFFF9E9E6);
  static const Color errorMedium = Color(0xFFD38478);
  static const Color errorDark = Color(0xFF9B4035);
}

/// Famílias tipográficas do design system (`typography.*` em `tokens.json`),
/// embarcadas como assets no `pubspec.yaml`.
abstract final class PsiFonts {
  /// `typography.display` — títulos/headings.
  static const String display = 'DM Sans';

  /// `typography.body` — corpo de texto.
  static const String body = 'Inter';

  /// `typography.serif` — acentos serifados (itálico por padrão).
  static const String serif = 'Fraunces';
}
