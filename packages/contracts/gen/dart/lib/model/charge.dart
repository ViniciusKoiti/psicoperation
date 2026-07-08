//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class Charge {
  /// Returns a new [Charge] instance.
  Charge({
    required this.id,
    required this.patientId,
    required this.competence,
    required this.amount,
    required this.dueDate,
    required this.status,
    this.interest,
    this.payment,
    required this.createdAt,
  });

  /// Identificador único da cobrança.
  String id;

  /// Paciente cobrado.
  String patientId;

  /// Competência (mês de referência) da mensalidade no formato `AAAA-MM`. Ex.: `2026-07`. Distinta de IsoDate por não ter dia.
  String competence;

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  int amount;

  /// Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
  DateTime dueDate;

  ChargeStatus status;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SimpleInterestParams? interest;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Payment? payment;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is Charge &&
    other.id == id &&
    other.patientId == patientId &&
    other.competence == competence &&
    other.amount == amount &&
    other.dueDate == dueDate &&
    other.status == status &&
    other.interest == interest &&
    other.payment == payment &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (patientId.hashCode) +
    (competence.hashCode) +
    (amount.hashCode) +
    (dueDate.hashCode) +
    (status.hashCode) +
    (interest == null ? 0 : interest!.hashCode) +
    (payment == null ? 0 : payment!.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'Charge[id=$id, patientId=$patientId, competence=$competence, amount=$amount, dueDate=$dueDate, status=$status, interest=$interest, payment=$payment, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'patientId'] = this.patientId;
      json[r'competence'] = this.competence;
      json[r'amount'] = this.amount;
      json[r'dueDate'] = _dateFormatter.format(this.dueDate.toUtc());
      json[r'status'] = this.status;
    if (this.interest != null) {
      json[r'interest'] = this.interest;
    } else {
      json[r'interest'] = null;
    }
    if (this.payment != null) {
      json[r'payment'] = this.payment;
    } else {
      json[r'payment'] = null;
    }
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [Charge] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static Charge? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "Charge[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "Charge[id]" has a null value in JSON.');
        assert(json.containsKey(r'patientId'), 'Required key "Charge[patientId]" is missing from JSON.');
        assert(json[r'patientId'] != null, 'Required key "Charge[patientId]" has a null value in JSON.');
        assert(json.containsKey(r'competence'), 'Required key "Charge[competence]" is missing from JSON.');
        assert(json[r'competence'] != null, 'Required key "Charge[competence]" has a null value in JSON.');
        assert(json.containsKey(r'amount'), 'Required key "Charge[amount]" is missing from JSON.');
        assert(json[r'amount'] != null, 'Required key "Charge[amount]" has a null value in JSON.');
        assert(json.containsKey(r'dueDate'), 'Required key "Charge[dueDate]" is missing from JSON.');
        assert(json[r'dueDate'] != null, 'Required key "Charge[dueDate]" has a null value in JSON.');
        assert(json.containsKey(r'status'), 'Required key "Charge[status]" is missing from JSON.');
        assert(json[r'status'] != null, 'Required key "Charge[status]" has a null value in JSON.');
        assert(json.containsKey(r'createdAt'), 'Required key "Charge[createdAt]" is missing from JSON.');
        assert(json[r'createdAt'] != null, 'Required key "Charge[createdAt]" has a null value in JSON.');
        return true;
      }());

      return Charge(
        id: mapValueOfType<String>(json, r'id')!,
        patientId: mapValueOfType<String>(json, r'patientId')!,
        competence: mapValueOfType<String>(json, r'competence')!,
        amount: mapValueOfType<int>(json, r'amount')!,
        dueDate: mapDateTime(json, r'dueDate', r'')!,
        status: ChargeStatus.fromJson(json[r'status'])!,
        interest: SimpleInterestParams.fromJson(json[r'interest']),
        payment: Payment.fromJson(json[r'payment']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
      );
    }
    return null;
  }

  static List<Charge> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Charge>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Charge.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, Charge> mapFromJson(dynamic json) {
    final map = <String, Charge>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = Charge.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of Charge-objects as value to a dart map
  static Map<String, List<Charge>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<Charge>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = Charge.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'patientId',
    'competence',
    'amount',
    'dueDate',
    'status',
    'createdAt',
  };
}

