import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import '../../../app/http_adapter_support.dart';
import 'profile_repository.dart';

/// Client HTTP real do [ProfileRepository], criado na integração mobile
/// (PSI-045) — não existia antes desta tarefa (o ponto de composição
/// `app/app.dart` lançava `UnimplementedError` para o ambiente `prod`).
///
/// [currentProfile] usa `GET /auth/session` (`SessionResponse.user`) — a
/// spec OpenAPI não modela um endpoint dedicado de perfil (`/users/me` ou
/// equivalente); a sessão corrente é a única fonte de [User] disponível, e
/// já é exigida (bearer token) para qualquer tela autenticada.
///
/// **Divergência confirmada nesta tarefa, registrada para o orquestrador**:
/// [updateProfile] (edição do nome de exibição, tela de configurações,
/// PSI-043) não tem endpoint real — a spec não modela alteração de nome nem
/// de outros campos de perfil (mesmo gap já documentado em
/// `ProfileRepository`/`SettingsAdapter`). Lança
/// [ProfileRepositoryException] com mensagem pt-BR clara em vez de
/// `UnimplementedError`: a tela de configurações já trata essa exceção
/// genericamente (mostra "Não foi possível salvar o perfil."), então o
/// comportamento é uma falha de salvamento normal, não um crash — mas a
/// funcionalidade de fato não persiste até que `packages/contracts` modele
/// um contrato de escrita de perfil (fora do escopo/allowed_paths desta
/// tarefa).
final class HttpProfileRepository implements ProfileRepository {
  HttpProfileRepository({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  @override
  Future<User> currentProfile() async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/auth/session',
        'GET',
        const [],
        null,
        const {},
        const {},
        null,
      ),
      (message) => ProfileRepositoryException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => SessionResponse.fromJson(_decode(response.body))!.user,
        (message) => ProfileRepositoryException(message),
      );
    }
    if (response.statusCode == 401) {
      throw const ProfileRepositoryException('Sua sessão expirou. Faça login novamente.');
    }
    throw ProfileRepositoryException(
      _problemMessage(response.body) ??
          'Não foi possível carregar o perfil (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<User> updateProfile(String name) {
    // Gap de contrato conhecido (ver documentação da classe): sem endpoint
    // real de escrita de perfil. Falha explícita (mensagem pt-BR já tratada
    // pelos chamadores existentes) em vez de fingir sucesso silenciosamente.
    throw const ProfileRepositoryException(
      'Ainda não é possível alterar o nome de exibição por aqui.',
    );
  }

  dynamic _decode(String body) => body.isEmpty ? null : jsonDecode(body);

  String? _problemMessage(String body) {
    if (body.isEmpty) return null;
    try {
      final problem = Problem.fromJson(_decode(body));
      return problem?.detail ?? problem?.title;
    } catch (_) {
      return null;
    }
  }
}
