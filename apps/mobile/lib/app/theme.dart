import 'package:flutter/material.dart';

import 'tokens.dart';

/// Tema Material 3 do PsiOps derivado dos tokens do design system
/// (`packages/ui/tokens.json`, espelhado em [PsiColors]/[PsiFonts]).
///
/// Mapeamento token → slot do `ColorScheme` (auditável para fidelidade
/// visual — cada slot cita a origem no token):
///
/// | slot Material 3        | token de origem            |
/// |------------------------|----------------------------|
/// | primary                | colors.primary.600         |
/// | onPrimary              | colors.neutral.0           |
/// | primaryContainer       | colors.primary.100         |
/// | onPrimaryContainer     | colors.primary.900         |
/// | secondary              | colors.accent.500          |
/// | onSecondary            | colors.neutral.0           |
/// | secondaryContainer     | colors.accent.100          |
/// | onSecondaryContainer   | colors.accent.900          |
/// | tertiary               | colors.calm.base           |
/// | onTertiary             | colors.neutral.0           |
/// | tertiaryContainer      | colors.calm.soft           |
/// | onTertiaryContainer    | colors.calm.deep           |
/// | error                  | colors.error.dark          |
/// | onError                | colors.neutral.0           |
/// | errorContainer         | colors.error.light         |
/// | onErrorContainer       | colors.error.dark          |
/// | surface                | colors.neutral.0           |
/// | onSurface              | colors.neutral.900         |
/// | surfaceContainerLowest | colors.neutral.0           |
/// | surfaceContainer       | colors.neutral.100         |
/// | surfaceContainerHigh   | colors.neutral.200         |
/// | onSurfaceVariant       | colors.neutral.600         |
/// | outline                | colors.neutral.300         |
/// | outlineVariant         | colors.neutral.200         |
///
/// O app é light-only no MVP (o design system só define uma paleta clara);
/// um tema escuro derivado dos mesmos tokens fica para trabalho futuro.
abstract final class PsiTheme {
  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: PsiColors.primary600,
      onPrimary: PsiColors.neutral0,
      primaryContainer: PsiColors.primary100,
      onPrimaryContainer: PsiColors.primary900,
      secondary: PsiColors.accent500,
      onSecondary: PsiColors.neutral0,
      secondaryContainer: PsiColors.accent100,
      onSecondaryContainer: PsiColors.accent900,
      tertiary: PsiColors.calmBase,
      onTertiary: PsiColors.neutral0,
      tertiaryContainer: PsiColors.calmSoft,
      onTertiaryContainer: PsiColors.calmDeep,
      error: PsiColors.errorDark,
      onError: PsiColors.neutral0,
      errorContainer: PsiColors.errorLight,
      onErrorContainer: PsiColors.errorDark,
      surface: PsiColors.neutral0,
      onSurface: PsiColors.neutral900,
      surfaceContainerLowest: PsiColors.neutral0,
      surfaceContainerLow: PsiColors.neutral50,
      surfaceContainer: PsiColors.neutral100,
      surfaceContainerHigh: PsiColors.neutral200,
      surfaceContainerHighest: PsiColors.neutral300,
      onSurfaceVariant: PsiColors.neutral600,
      outline: PsiColors.neutral300,
      outlineVariant: PsiColors.neutral200,
      inverseSurface: PsiColors.neutral900,
      onInverseSurface: PsiColors.neutral50,
      inversePrimary: PsiColors.primary300,
      shadow: PsiColors.neutral950,
      scrim: PsiColors.neutral950,
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: PsiColors.neutral50,
      fontFamily: PsiFonts.body,
    );

    // Tipografia: display/headline usam DM Sans (typography.display); o corpo
    // usa Inter (typography.body, aplicado via fontFamily acima). Fraunces
    // (typography.serif) é reservado para acentos pontuais e aplicado
    // localmente onde necessário, não como fonte padrão de texto.
    return base.copyWith(
      textTheme: base.textTheme.copyWith(
        displayLarge: base.textTheme.displayLarge?.copyWith(
          fontFamily: PsiFonts.display,
        ),
        displayMedium: base.textTheme.displayMedium?.copyWith(
          fontFamily: PsiFonts.display,
        ),
        displaySmall: base.textTheme.displaySmall?.copyWith(
          fontFamily: PsiFonts.display,
        ),
        headlineLarge: base.textTheme.headlineLarge?.copyWith(
          fontFamily: PsiFonts.display,
        ),
        headlineMedium: base.textTheme.headlineMedium?.copyWith(
          fontFamily: PsiFonts.display,
        ),
        headlineSmall: base.textTheme.headlineSmall?.copyWith(
          fontFamily: PsiFonts.display,
        ),
        titleLarge: base.textTheme.titleLarge?.copyWith(
          fontFamily: PsiFonts.display,
        ),
      ),
    );
  }

  /// Estilo utilitário para acentos serifados (Fraunces itálico), como as
  /// ênfases da landing (`typography.serif.defaultStyle == "italic"`).
  static const TextStyle serifAccent = TextStyle(
    fontFamily: PsiFonts.serif,
    fontStyle: FontStyle.italic,
    fontWeight: FontWeight.w500,
  );
}
