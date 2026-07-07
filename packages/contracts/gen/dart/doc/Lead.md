# psiops_contracts.model.Lead

## Load the model package
```dart
import 'package:psiops_contracts/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Identificador único do lead. | 
**name** | **String** |  | 
**whatsapp** | **String** | Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp). | 
**email** | **String** |  | 
**createdAt** | [**DateTime**](DateTime.md) | Instante de entrada na lista de espera (ISO 8601, UTC). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


