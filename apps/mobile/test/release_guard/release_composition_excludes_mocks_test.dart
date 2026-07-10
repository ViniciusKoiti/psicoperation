import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Verificação automatizada de que o build de release não referencia mocks
/// (PSI-045, acceptance criteria): falha se código `InMemory*` alcançar a
/// composição de release.
///
/// Não depende de rede nem da API — roda localmente com:
/// ```bash
/// cd apps/mobile
/// flutter test test/release_guard/release_composition_excludes_mocks_test.dart
/// ```
/// e já faz parte do `flutter test` padrão (ver `apps/mobile/README.md`).
///
/// Como funciona: o app não usa flavors nativos (decisão registrada em
/// `app/env.dart`) — mock vs. HTTP real é uma escolha em tempo de execução
/// dentro de `app/app.dart`, o único ponto de composição (`_xxxFor`). Como
/// não há dois binários/entrypoints separados para comparar via
/// tree-shaking, este teste inspeciona estaticamente o código-fonte a partir
/// desse ponto de composição (a checagem de "grafo de imports" sugerida no
/// manifesto): garante, por parsing textual, que
/// 1. cada método de composição só constrói um `InMemory*` dentro do braço
///    `if (environment.usesMocks) { ... }` — nunca fora dele (ou seja, nunca
///    no caminho executado quando o app roda com
///    `--dart-define=PSIOPS_ENV=prod`, o único usado em builds de release);
/// 2. nenhum outro arquivo de `lib/` (fora do próprio `app/app.dart`)
///    constrói e retorna um `InMemory*` — só as classes que os DEFINEM
///    (que naturalmente mencionam o próprio nome) vivem fora daqui.
void main() {
  late String appDartText;

  setUpAll(() {
    final file = File('lib/app/app.dart');
    if (!file.existsSync()) {
      fail(
        'lib/app/app.dart não encontrado a partir do diretório corrente '
        '(${Directory.current.path}). Rode este teste a partir de '
        'apps/mobile (ex.: `cd apps/mobile && flutter test`).',
      );
    }
    appDartText = file.readAsStringSync();
  });

  test(
    'todo método de composição em app.dart guarda InMemory* atrás de usesMocks',
    () {
      final methodPattern = RegExp(
        r'static\s+\S+\s+_(\w+)For\(AppEnvironment environment\)\s*\{',
      );
      final matches = methodPattern.allMatches(appDartText).toList();

      // Sete adapters compostos por ambiente hoje (auth, profile, appointment,
      // patients, charge, task, settings). Se este número cair, a regex pode
      // ter parado de casar por causa de uma refatoração — falhe alto em vez
      // de "passar" silenciosamente sem checar nada.
      expect(
        matches.length,
        greaterThanOrEqualTo(7),
        reason:
            'Esperava >= 7 métodos "_xxxFor(AppEnvironment environment)" em '
            'app.dart (um por adapter). Encontrados: ${matches.length}. Se '
            'app.dart foi reestruturado, atualize este teste e a regex.',
      );

      for (final method in matches) {
        final name = method.group(1);
        final braceOpen = method.end - 1;
        expect(appDartText[braceOpen], '{');
        final braceClose = _findMatchingBrace(appDartText, braceOpen);
        final body = appDartText.substring(braceOpen + 1, braceClose);

        final ifPattern = RegExp(r'if\s*\(([^)]*)\)\s*\{');
        final ifMatch = ifPattern.firstMatch(body);
        expect(
          ifMatch,
          isNotNull,
          reason:
              '_${name}For não começa com um if-guard — não foi possível '
              'verificar se o mock está protegido por usesMocks.',
        );

        expect(
          ifMatch!.group(1),
          contains('usesMocks'),
          reason:
              'A condição do if em _${name}For não referencia usesMocks: '
              '"${ifMatch.group(1)}".',
        );

        final ifBraceOpen = ifMatch.end - 1;
        final ifBraceClose = _findMatchingBrace(body, ifBraceOpen);
        final ifBody = body.substring(ifBraceOpen + 1, ifBraceClose);

        expect(
          _returnsInMemory.hasMatch(ifBody),
          isTrue,
          reason:
              'O braço guardado por usesMocks em _${name}For não constrói '
              'nenhum InMemory* — esperava algo como "return InMemoryXxx();".',
        );

        final remainder =
            body.substring(0, ifMatch.start) + body.substring(ifBraceClose + 1);
        expect(
          _returnsInMemory.hasMatch(remainder),
          isFalse,
          reason:
              '_${name}For constrói um InMemory* FORA do braço guardado por '
              'usesMocks — isso vazaria um mock para o caminho executado em '
              'produção (--dart-define=PSIOPS_ENV=prod).',
        );
      }
    },
  );

  test(
    'nenhum arquivo de lib/ fora de app/app.dart constrói e retorna um InMemory*',
    () {
      final libDir = Directory('lib');
      expect(
        libDir.existsSync(),
        isTrue,
        reason: 'lib/ não encontrado a partir de ${Directory.current.path}.',
      );

      final offenders = <String>[];
      for (final entity in libDir.listSync(recursive: true)) {
        if (entity is! File || !entity.path.endsWith('.dart')) continue;
        final normalized = entity.path.replaceAll('\\', '/');
        if (normalized.endsWith('lib/app/app.dart')) continue;

        final content = entity.readAsStringSync();
        if (_returnsInMemory.hasMatch(content)) {
          offenders.add(normalized);
        }
      }

      expect(
        offenders,
        isEmpty,
        reason:
            'Arquivo(s) fora do ponto de composição (app/app.dart) constroem '
            'e retornam um InMemory*: $offenders. Isso indica que código mock '
            'pode alcançar a composição de release por um caminho não '
            'coberto pela checagem de app.dart.',
      );
    },
  );
}

/// Constrói-e-retorna um mock (`return InMemoryXxx();`) — nunca casa com a
/// *definição* de um construtor (`InMemoryXxx({...})`), porque exige a
/// palavra-chave `return` antes do nome da classe.
final RegExp _returnsInMemory = RegExp(r'return\s+InMemory\w+\(\)');

int _findMatchingBrace(String text, int openIndex) {
  if (text[openIndex] != '{') {
    throw ArgumentError('Índice $openIndex não aponta para "{" em: '
        '${text.substring(openIndex, (openIndex + 20).clamp(0, text.length))}');
  }
  var depth = 0;
  for (var i = openIndex; i < text.length; i++) {
    if (text[i] == '{') depth++;
    if (text[i] == '}') {
      depth--;
      if (depth == 0) return i;
    }
  }
  throw StateError('Chave não fechada a partir do índice $openIndex.');
}
