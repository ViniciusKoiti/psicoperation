# psiops_contracts.api.AuthApi

## Load the API package
```dart
import 'package:psiops_contracts/api.dart';
```

All URIs are relative to */api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getCurrentSession**](AuthApi.md#getcurrentsession) | **GET** /auth/session | Consulta a sessão corrente
[**loginUser**](AuthApi.md#loginuser) | **POST** /auth/login | Autentica com e-mail e senha
[**refreshToken**](AuthApi.md#refreshtoken) | **POST** /auth/refresh | Renova o par de tokens
[**registerUser**](AuthApi.md#registeruser) | **POST** /auth/register | Registra uma nova conta


# **getCurrentSession**
> GetCurrentSession200Response getCurrentSession()

Consulta a sessão corrente

Retorna a conta autenticada e a expiração do access token apresentado. Requer bearer token JWT válido.

### Example
```dart
import 'package:psiops_contracts/api.dart';
// TODO Configure HTTP Bearer authorization: bearerAuth
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearerAuth').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearerAuth').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AuthApi();

try {
    final result = api_instance.getCurrentSession();
    print(result);
} catch (e) {
    print('Exception when calling AuthApi->getCurrentSession: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetCurrentSession200Response**](GetCurrentSession200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loginUser**
> RegisterUser201Response loginUser(loginUserRequest)

Autentica com e-mail e senha

Valida as credenciais e retorna a conta autenticada com um novo par de tokens (access JWT + refresh). Endpoint público.

### Example
```dart
import 'package:psiops_contracts/api.dart';

final api_instance = AuthApi();
final loginUserRequest = LoginUserRequest(); // LoginUserRequest | 

try {
    final result = api_instance.loginUser(loginUserRequest);
    print(result);
} catch (e) {
    print('Exception when calling AuthApi->loginUser: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginUserRequest** | [**LoginUserRequest**](LoginUserRequest.md)|  | 

### Return type

[**RegisterUser201Response**](RegisterUser201Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **refreshToken**
> RegisterUser201ResponseTokens refreshToken(refreshTokenRequest)

Renova o par de tokens

Troca um refresh token válido por um novo par de tokens. O refresh token apresentado é invalidado (rotação de uso único). Endpoint público — a credencial é o próprio refresh token no corpo.

### Example
```dart
import 'package:psiops_contracts/api.dart';

final api_instance = AuthApi();
final refreshTokenRequest = RefreshTokenRequest(); // RefreshTokenRequest | 

try {
    final result = api_instance.refreshToken(refreshTokenRequest);
    print(result);
} catch (e) {
    print('Exception when calling AuthApi->refreshToken: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **refreshTokenRequest** | [**RefreshTokenRequest**](RefreshTokenRequest.md)|  | 

### Return type

[**RegisterUser201ResponseTokens**](RegisterUser201ResponseTokens.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **registerUser**
> RegisterUser201Response registerUser(registerUserRequest)

Registra uma nova conta

Cria a conta da psicóloga e já inicia a sessão, retornando a conta criada e o par de tokens (access JWT + refresh). Endpoint público.

### Example
```dart
import 'package:psiops_contracts/api.dart';

final api_instance = AuthApi();
final registerUserRequest = RegisterUserRequest(); // RegisterUserRequest | 

try {
    final result = api_instance.registerUser(registerUserRequest);
    print(result);
} catch (e) {
    print('Exception when calling AuthApi->registerUser: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **registerUserRequest** | [**RegisterUserRequest**](RegisterUserRequest.md)|  | 

### Return type

[**RegisterUser201Response**](RegisterUser201Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

