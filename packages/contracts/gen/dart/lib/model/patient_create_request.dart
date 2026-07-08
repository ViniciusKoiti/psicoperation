//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PatientCreateRequest {
  /// Returns a new [PatientCreateRequest] instance.
  PatientCreateRequest({
    required this.name,
    this.whatsapp,
    this.email,
    required this.monthlyFee,
    required this.billingDay,
    this.notes,
  });

  String name;

  /// Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? whatsapp;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? email;

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  int monthlyFee;

  /// Minimum value: 1
  /// Maximum value: 28
  int billingDay;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? notes;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PatientCreateRequest &&
    other.name == name &&
    other.whatsapp == whatsapp &&
    other.email == email &&
    other.monthlyFee == monthlyFee &&
    other.billingDay == billingDay &&
    other.notes == notes;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (whatsapp == null ? 0 : whatsapp!.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (monthlyFee.hashCode) +
    (billingDay.hashCode) +
    (notes == null ? 0 : notes!.hashCode);

  @override
  String toString() => 'PatientCreateRequest[name=$name, whatsapp=$whatsapp, email=$email, monthlyFee=$monthlyFee, billingDay=$billingDay, notes=$notes]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
    if (this.whatsapp != null) {
      json[r'whatsapp'] = this.whatsapp;
    } else {
      json[r'whatsapp'] = null;
    }
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
      json[r'email'] = null;
    }
      json[r'monthlyFee'] = this.monthlyFee;
      json[r'billingDay'] = this.billingDay;
    if (this.notes != null) {
      json[r'notes'] = this.notes;
    } else {
      json[r'notes'] = null;
    }
    return json;
  }

  /// Returns a new [PatientCreateRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PatientCreateRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "PatientCreateRequest[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "PatientCreateRequest[name]" has a null value in JSON.');
        assert(json.containsKey(r'monthlyFee'), 'Required key "PatientCreateRequest[monthlyFee]" is missing from JSON.');
        assert(json[r'monthlyFee'] != null, 'Required key "PatientCreateRequest[monthlyFee]" has a null value in JSON.');
        assert(json.containsKey(r'billingDay'), 'Required key "PatientCreateRequest[billingDay]" is missing from JSON.');
        assert(json[r'billingDay'] != null, 'Required key "PatientCreateRequest[billingDay]" has a null value in JSON.');
        return true;
      }());

      return PatientCreateRequest(
        name: mapValueOfType<String>(json, r'name')!,
        whatsapp: mapValueOfType<String>(json, r'whatsapp'),
        email: mapValueOfType<String>(json, r'email'),
        monthlyFee: mapValueOfType<int>(json, r'monthlyFee')!,
        billingDay: mapValueOfType<int>(json, r'billingDay')!,
        notes: mapValueOfType<String>(json, r'notes'),
      );
    }
    return null;
  }

  static List<PatientCreateRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PatientCreateRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PatientCreateRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PatientCreateRequest> mapFromJson(dynamic json) {
    final map = <String, PatientCreateRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PatientCreateRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PatientCreateRequest-objects as value to a dart map
  static Map<String, List<PatientCreateRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PatientCreateRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PatientCreateRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'monthlyFee',
    'billingDay',
  };
}

