# psiops_contracts.model.RegisterUser201ResponseTokens

## Load the model package
```dart
import 'package:psiops_contracts/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tokenType** | **String** | Tipo do token, sempre `Bearer`. | 
**accessToken** | **String** | JWT de acesso, de curta duração. | 
**expiresIn** | **int** | Segundos até a expiração do access token, contados da emissão. | 
**refreshToken** | **String** | Refresh token opaco para obter um novo par via /auth/refresh. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


