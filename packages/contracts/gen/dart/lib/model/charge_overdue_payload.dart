//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChargeOverduePayload {
  /// Returns a new [ChargeOverduePayload] instance.
  ChargeOverduePayload({
    required this.chargeId,
    required this.patientId,
    required this.competence,
    required this.amount,
    required this.dueDate,
  });

  String chargeId;

  String patientId;

  /// Competência (mês de referência) da mensalidade no formato `AAAA-MM`. Ex.: `2026-07`. Distinta de IsoDate por não ter dia.
  String competence;

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  int amount;

  /// Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
  DateTime dueDate;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChargeOverduePayload &&
    other.chargeId == chargeId &&
    other.patientId == patientId &&
    other.competence == competence &&
    other.amount == amount &&
    other.dueDate == dueDate;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (chargeId.hashCode) +
    (patientId.hashCode) +
    (competence.hashCode) +
    (amount.hashCode) +
    (dueDate.hashCode);

  @override
  String toString() => 'ChargeOverduePayload[chargeId=$chargeId, patientId=$patientId, competence=$competence, amount=$amount, dueDate=$dueDate]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'chargeId'] = this.chargeId;
      json[r'patientId'] = this.patientId;
      json[r'competence'] = this.competence;
      json[r'amount'] = this.amount;
      json[r'dueDate'] = _dateFormatter.format(this.dueDate.toUtc());
    return json;
  }

  /// Returns a new [ChargeOverduePayload] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChargeOverduePayload? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'chargeId'), 'Required key "ChargeOverduePayload[chargeId]" is missing from JSON.');
        assert(json[r'chargeId'] != null, 'Required key "ChargeOverduePayload[chargeId]" has a null value in JSON.');
        assert(json.containsKey(r'patientId'), 'Required key "ChargeOverduePayload[patientId]" is missing from JSON.');
        assert(json[r'patientId'] != null, 'Required key "ChargeOverduePayload[patientId]" has a null value in JSON.');
        assert(json.containsKey(r'competence'), 'Required key "ChargeOverduePayload[competence]" is missing from JSON.');
        assert(json[r'competence'] != null, 'Required key "ChargeOverduePayload[competence]" has a null value in JSON.');
        assert(json.containsKey(r'amount'), 'Required key "ChargeOverduePayload[amount]" is missing from JSON.');
        assert(json[r'amount'] != null, 'Required key "ChargeOverduePayload[amount]" has a null value in JSON.');
        assert(json.containsKey(r'dueDate'), 'Required key "ChargeOverduePayload[dueDate]" is missing from JSON.');
        assert(json[r'dueDate'] != null, 'Required key "ChargeOverduePayload[dueDate]" has a null value in JSON.');
        return true;
      }());

      return ChargeOverduePayload(
        chargeId: mapValueOfType<String>(json, r'chargeId')!,
        patientId: mapValueOfType<String>(json, r'patientId')!,
        competence: mapValueOfType<String>(json, r'competence')!,
        amount: mapValueOfType<int>(json, r'amount')!,
        dueDate: mapDateTime(json, r'dueDate', r'')!,
      );
    }
    return null;
  }

  static List<ChargeOverduePayload> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChargeOverduePayload>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChargeOverduePayload.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChargeOverduePayload> mapFromJson(dynamic json) {
    final map = <String, ChargeOverduePayload>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChargeOverduePayload.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChargeOverduePayload-objects as value to a dart map
  static Map<String, List<ChargeOverduePayload>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChargeOverduePayload>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChargeOverduePayload.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'chargeId',
    'patientId',
    'competence',
    'amount',
    'dueDate',
  };
}

