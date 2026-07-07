# psiops_contracts.model.RegisterRequest

## Load the model package
```dart
import 'package:psiops_contracts/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **String** | Nome completo. | 
**email** | **String** | E-mail de login (único por conta). | 
**password** | **String** | Senha em texto claro (transporte sempre via TLS). Mínimo de 8 caracteres; máximo de 72 bytes (limite do BCrypt usado no backend). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


