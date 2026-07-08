//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateChargeRequest {
  /// Returns a new [CreateChargeRequest] instance.
  CreateChargeRequest({
    required this.patientId,
    required this.competence,
    required this.amount,
    required this.dueDate,
    this.interest,
  });

  String patientId;

  /// Competência (mês de referência) da mensalidade no formato `AAAA-MM`. Ex.: `2026-07`. Distinta de IsoDate por não ter dia.
  String competence;

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  int amount;

  /// Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
  DateTime dueDate;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SimpleInterestParams? interest;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateChargeRequest &&
    other.patientId == patientId &&
    other.competence == competence &&
    other.amount == amount &&
    other.dueDate == dueDate &&
    other.interest == interest;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (patientId.hashCode) +
    (competence.hashCode) +
    (amount.hashCode) +
    (dueDate.hashCode) +
    (interest == null ? 0 : interest!.hashCode);

  @override
  String toString() => 'CreateChargeRequest[patientId=$patientId, competence=$competence, amount=$amount, dueDate=$dueDate, interest=$interest]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'patientId'] = this.patientId;
      json[r'competence'] = this.competence;
      json[r'amount'] = this.amount;
      json[r'dueDate'] = _dateFormatter.format(this.dueDate.toUtc());
    if (this.interest != null) {
      json[r'interest'] = this.interest;
    } else {
      json[r'interest'] = null;
    }
    return json;
  }

  /// Returns a new [CreateChargeRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateChargeRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'patientId'), 'Required key "CreateChargeRequest[patientId]" is missing from JSON.');
        assert(json[r'patientId'] != null, 'Required key "CreateChargeRequest[patientId]" has a null value in JSON.');
        assert(json.containsKey(r'competence'), 'Required key "CreateChargeRequest[competence]" is missing from JSON.');
        assert(json[r'competence'] != null, 'Required key "CreateChargeRequest[competence]" has a null value in JSON.');
        assert(json.containsKey(r'amount'), 'Required key "CreateChargeRequest[amount]" is missing from JSON.');
        assert(json[r'amount'] != null, 'Required key "CreateChargeRequest[amount]" has a null value in JSON.');
        assert(json.containsKey(r'dueDate'), 'Required key "CreateChargeRequest[dueDate]" is missing from JSON.');
        assert(json[r'dueDate'] != null, 'Required key "CreateChargeRequest[dueDate]" has a null value in JSON.');
        return true;
      }());

      return CreateChargeRequest(
        patientId: mapValueOfType<String>(json, r'patientId')!,
        competence: mapValueOfType<String>(json, r'competence')!,
        amount: mapValueOfType<int>(json, r'amount')!,
        dueDate: mapDateTime(json, r'dueDate', r'')!,
        interest: SimpleInterestParams.fromJson(json[r'interest']),
      );
    }
    return null;
  }

  static List<CreateChargeRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateChargeRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateChargeRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateChargeRequest> mapFromJson(dynamic json) {
    final map = <String, CreateChargeRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateChargeRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateChargeRequest-objects as value to a dart map
  static Map<String, List<CreateChargeRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateChargeRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateChargeRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'patientId',
    'competence',
    'amount',
    'dueDate',
  };
}

