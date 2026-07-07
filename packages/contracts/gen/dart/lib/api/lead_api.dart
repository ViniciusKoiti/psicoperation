//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LeadApi {
  LeadApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Entra na lista de espera
  ///
  /// Registra um lead da lista de espera capturado pelo formulário da landing page (nome, WhatsApp brasileiro em E.164 e e-mail). Endpoint público.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateLeadRequest] createLeadRequest (required):
  Future<Response> createLeadWithHttpInfo(CreateLeadRequest createLeadRequest, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final path = r'/leads';

    // ignore: prefer_final_locals
    Object? postBody = createLeadRequest;

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

  /// Entra na lista de espera
  ///
  /// Registra um lead da lista de espera capturado pelo formulário da landing page (nome, WhatsApp brasileiro em E.164 e e-mail). Endpoint público.
  ///
  /// Parameters:
  ///
  /// * [CreateLeadRequest] createLeadRequest (required):
  Future<CreateLead201Response?> createLead(CreateLeadRequest createLeadRequest, { Future<void>? abortTrigger, }) async {
    final response = await createLeadWithHttpInfo(createLeadRequest, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'CreateLead201Response',) as CreateLead201Response;
    
    }
    return null;
  }
}
