# psiops_contracts.model.ValidationProblem

## Load the model package
```dart
import 'package:psiops_contracts/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **String** | URI que identifica o tipo do problema. `about:blank` quando o erro é totalmente descrito pelo status HTTP. | [optional] [default to 'about:blank']
**title** | **String** | Resumo curto e legível do tipo de problema (pt-BR). Não muda entre ocorrências do mesmo tipo. | 
**status** | **int** | Código de status HTTP gerado pelo servidor para esta ocorrência. | 
**detail** | **String** | Explicação legível (pt-BR) específica desta ocorrência. | [optional] 
**instance** | **String** | Referência URI (RFC 9457 permite relativa) que identifica esta ocorrência específica do problema. | [optional] 
**violations** | [**List<RegisterUser400ResponseAllOfViolationsInner>**](RegisterUser400ResponseAllOfViolationsInner.md) | Lista de violações por campo (ao menos uma). | [default to const []]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


