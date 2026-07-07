# psiops_contracts.api.LeadApi

## Load the API package
```dart
import 'package:psiops_contracts/api.dart';
```

All URIs are relative to */api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createLead**](LeadApi.md#createlead) | **POST** /leads | Entra na lista de espera


# **createLead**
> CreateLead201Response createLead(createLeadRequest)

Entra na lista de espera

Registra um lead da lista de espera capturado pelo formulário da landing page (nome, WhatsApp brasileiro em E.164 e e-mail). Endpoint público.

### Example
```dart
import 'package:psiops_contracts/api.dart';

final api_instance = LeadApi();
final createLeadRequest = CreateLeadRequest(); // CreateLeadRequest | 

try {
    final result = api_instance.createLead(createLeadRequest);
    print(result);
} catch (e) {
    print('Exception when calling LeadApi->createLead: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createLeadRequest** | [**CreateLeadRequest**](CreateLeadRequest.md)|  | 

### Return type

[**CreateLead201Response**](CreateLead201Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

