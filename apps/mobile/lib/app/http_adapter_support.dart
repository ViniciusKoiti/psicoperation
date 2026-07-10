/// Utilitários compartilhados por todos os `Http*Adapter` (PSI-045).
///
/// `ApiClient.invokeAPI` (gerado em `packages/contracts/gen/dart`) já
/// normaliza qualquer falha de infraestrutura — socket, TLS, I/O, conexão
/// HTTP recusada, timeout — em uma única exceção, [ApiException] (ver
/// `api_client.dart` do gen/dart). Isso significa que **todo** erro de rede
/// chega aos adapters deste app como [ApiException], nunca como
/// `SocketException`/`ClientException` cru.
///
/// Antes desta tarefa, nenhum `Http*Adapter` capturava [ApiException]: uma
/// falha de conectividade escaparia como exceção não mapeada. Alguns
/// consumidores (controllers com `catch` genérico) disfarçavam o problema,
/// mas outros só capturam a exceção de domínio específica (ex.:
/// `AgendaController.createAppointment` só trata `AppointmentAdapterException`)
/// — nesses call sites, uma `ApiException` crua propagaria sem tratamento.
/// [guardApiCall] fecha essa lacuna: todo `Http*Adapter` chama a API através
/// dela, garantindo que falha de conectividade sempre vira a exceção de
/// domínio correspondente, com mensagem pt-BR pronta para a UI.
library;

import 'package:psiops_contracts/api.dart';

/// Mensagem padrão pt-BR para falha de conectividade (sem internet, DNS,
/// TLS, timeout, conexão recusada — qualquer caso que o client gerado
/// normaliza como [ApiException]).
const String kNetworkErrorMessage =
    'Não foi possível conectar ao servidor. Verifique sua conexão com a '
    'internet e tente novamente.';

/// Mensagem padrão pt-BR quando a API responde, mas em um formato que o
/// client não consegue interpretar (contrato divergente, corpo corrompido,
/// campo obrigatório ausente) — usada por `parseOrThrow` para evitar que um
/// erro de parsing (`null`, `FormatException`) vaze como crash não tratado.
const String kUnexpectedResponseMessage =
    'A resposta do servidor não pôde ser interpretada. Tente novamente em '
    'instantes.';

/// Executa [call] (tipicamente `ApiClient.invokeAPI(...)`) convertendo
/// qualquer [ApiException] — já normalizada pelo client gerado a partir de
/// falhas de rede/TLS/I/O/timeout — na exceção de domínio produzida por
/// [onNetworkError] (ex.: `(msg) => AuthAdapterException(msg)`).
///
/// Nunca deixa a exceção genérica de infraestrutura escapar para quem chamou
/// o adapter — critério de aceite da PSI-045 ("erros de rede... mapeados
/// para os estados de UI já existentes, sem crashes em falha de conexão").
Future<T> guardApiCall<T>(
  Future<T> Function() call,
  Exception Function(String message) onNetworkError,
) async {
  try {
    return await call();
  } on ApiException {
    throw onNetworkError(kNetworkErrorMessage);
  }
}

/// Executa [parse] (tipicamente `Model.fromJson(...)!`) convertendo qualquer
/// falha de parsing (valor `null` inesperado via `!`, `FormatException`,
/// erro de tipo) na exceção de domínio produzida por [onParseError].
///
/// Evita que uma resposta 2xx em formato inesperado (contrato divergente
/// entre o mock e a API real, ou corpo corrompido) derrube a UI com um erro
/// de null-check não tratado.
T parseOrThrow<T>(
  T Function() parse,
  Exception Function(String message) onParseError,
) {
  try {
    return parse();
  } on Exception {
    throw onParseError(kUnexpectedResponseMessage);
  } on TypeError {
    throw onParseError(kUnexpectedResponseMessage);
  }
}
