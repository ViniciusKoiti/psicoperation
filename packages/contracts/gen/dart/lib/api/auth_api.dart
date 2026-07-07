//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AuthApi {
  AuthApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Consulta a sessão corrente
  ///
  /// Retorna a conta autenticada e a expiração do access token apresentado. Requer bearer token JWT válido.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getCurrentSessionWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/auth/session';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Consulta a sessão corrente
  ///
  /// Retorna a conta autenticada e a expiração do access token apresentado. Requer bearer token JWT válido.
  Future<GetCurrentSession200Response?> getCurrentSession({ Future<void>? abortTrigger, }) async {
    final response = await getCurrentSessionWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GetCurrentSession200Response',) as GetCurrentSession200Response;
    
    }
    return null;
  }

  /// Autentica com e-mail e senha
  ///
  /// Valida as credenciais e retorna a conta autenticada com um novo par de tokens (access JWT + refresh). Endpoint público.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [LoginUserRequest] loginUserRequest (required):
  Future<Response> loginUserWithHttpInfo(LoginUserRequest loginUserRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/auth/login';

    // ignore: prefer_final_locals
    Object? postBody = loginUserRequest;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Autentica com e-mail e senha
  ///
  /// Valida as credenciais e retorna a conta autenticada com um novo par de tokens (access JWT + refresh). Endpoint público.
  ///
  /// Parameters:
  ///
  /// * [LoginUserRequest] loginUserRequest (required):
  Future<RegisterUser201Response?> loginUser(LoginUserRequest loginUserRequest, { Future<void>? abortTrigger, }) async {
    final response = await loginUserWithHttpInfo(loginUserRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RegisterUser201Response',) as RegisterUser201Response;
    
    }
    return null;
  }

  /// Renova o par de tokens
  ///
  /// Troca um refresh token válido por um novo par de tokens. O refresh token apresentado é invalidado (rotação de uso único). Endpoint público — a credencial é o próprio refresh token no corpo.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [RefreshTokenRequest] refreshTokenRequest (required):
  Future<Response> refreshTokenWithHttpInfo(RefreshTokenRequest refreshTokenRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/auth/refresh';

    // ignore: prefer_final_locals
    Object? postBody = refreshTokenRequest;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Renova o par de tokens
  ///
  /// Troca um refresh token válido por um novo par de tokens. O refresh token apresentado é invalidado (rotação de uso único). Endpoint público — a credencial é o próprio refresh token no corpo.
  ///
  /// Parameters:
  ///
  /// * [RefreshTokenRequest] refreshTokenRequest (required):
  Future<RegisterUser201ResponseTokens?> refreshToken(RefreshTokenRequest refreshTokenRequest, { Future<void>? abortTrigger, }) async {
    final response = await refreshTokenWithHttpInfo(refreshTokenRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RegisterUser201ResponseTokens',) as RegisterUser201ResponseTokens;
    
    }
    return null;
  }

  /// Registra uma nova conta
  ///
  /// Cria a conta da psicóloga e já inicia a sessão, retornando a conta criada e o par de tokens (access JWT + refresh). Endpoint público.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [RegisterUserRequest] registerUserRequest (required):
  Future<Response> registerUserWithHttpInfo(RegisterUserRequest registerUserRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/auth/register';

    // ignore: prefer_final_locals
    Object? postBody = registerUserRequest;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Registra uma nova conta
  ///
  /// Cria a conta da psicóloga e já inicia a sessão, retornando a conta criada e o par de tokens (access JWT + refresh). Endpoint público.
  ///
  /// Parameters:
  ///
  /// * [RegisterUserRequest] registerUserRequest (required):
  Future<RegisterUser201Response?> registerUser(RegisterUserRequest registerUserRequest, { Future<void>? abortTrigger, }) async {
    final response = await registerUserWithHttpInfo(registerUserRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RegisterUser201Response',) as RegisterUser201Response;
    
    }
    return null;
  }
}
