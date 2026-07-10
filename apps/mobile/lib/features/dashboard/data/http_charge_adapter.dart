import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import '../../../app/http_adapter_support.dart';
import 'charge_adapter.dart';

/// Client HTTP real do [ChargeAdapter] (`GET /charges`), tipado por
/// [ChargePage]/[Charge] gerados de `packages/contracts/gen/dart`.
///
/// Exercitado contra a API real na integração mobile (PSI-045). Falhas de
/// conectividade e respostas em formato inesperado são mapeadas para
/// [ChargeAdapterException] (mensagem pt-BR), nunca propagadas cruas — ver
/// `http_adapter_support.dart`.
final class HttpChargeAdapter implements ChargeAdapter {
  HttpChargeAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  static const int _pageSize = 100;

  @override
  Future<List<Charge>> listCharges() async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/charges',
        'GET',
        [QueryParam('size', '$_pageSize')],
        null,
        const {},
        const {},
        null,
      ),
      (message) => ChargeAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () =>
            ChargePage.fromJson(
              response.body.isEmpty ? null : jsonDecode(response.body),
            )?.items ??
            const [],
        (message) => ChargeAdapterException(message),
      );
    }
    throw ChargeAdapterException(
      'Não foi possível carregar as cobranças (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Charge> createCharge(CreateChargeRequest request) async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/charges',
        'POST',
        const [],
        request,
        const {},
        const {},
        'application/json',
      ),
      (message) => ChargeAdapterException(message),
    );
    if (response.statusCode == 201) {
      return parseOrThrow(
        () => Charge.fromJson(_decode(response.body))!,
        (message) => ChargeAdapterException(message),
      );
    }
    if (response.statusCode == 409) {
      throw ChargeAlreadyExistsException(
        _problemMessage(response.body) ??
            'Já existe uma mensalidade emitida para este paciente nesta competência.',
      );
    }
    throw ChargeAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível emitir a mensalidade (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Charge> registerPayment(String chargeId, RegisterPaymentRequest request) async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/charges/$chargeId/payment',
        'POST',
        const [],
        request,
        const {},
        const {},
        'application/json',
      ),
      (message) => ChargeAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => Charge.fromJson(_decode(response.body))!,
        (message) => ChargeAdapterException(message),
      );
    }
    if (response.statusCode == 404) {
      throw ChargeNotFoundException(
        _problemMessage(response.body) ?? 'Mensalidade não encontrada.',
      );
    }
    if (response.statusCode == 409) {
      throw ChargeAlreadyPaidException(
        _problemMessage(response.body) ?? 'Esta mensalidade já foi paga.',
      );
    }
    throw ChargeAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível registrar o pagamento (HTTP ${response.statusCode}).',
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
