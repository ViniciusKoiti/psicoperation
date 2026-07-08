//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SettingsUpdateRequest {
  /// Returns a new [SettingsUpdateRequest] instance.
  SettingsUpdateRequest({
    this.defaultMonthlyFee,
    this.defaultBillingDay,
    this.defaultInterest,
    this.timezone,
  });

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? defaultMonthlyFee;

  /// Minimum value: 1
  /// Maximum value: 28
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? defaultBillingDay;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SimpleInterestParams? defaultInterest;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? timezone;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SettingsUpdateRequest &&
    other.defaultMonthlyFee == defaultMonthlyFee &&
    other.defaultBillingDay == defaultBillingDay &&
    other.defaultInterest == defaultInterest &&
    other.timezone == timezone;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (defaultMonthlyFee == null ? 0 : defaultMonthlyFee!.hashCode) +
    (defaultBillingDay == null ? 0 : defaultBillingDay!.hashCode) +
    (defaultInterest == null ? 0 : defaultInterest!.hashCode) +
    (timezone == null ? 0 : timezone!.hashCode);

  @override
  String toString() => 'SettingsUpdateRequest[defaultMonthlyFee=$defaultMonthlyFee, defaultBillingDay=$defaultBillingDay, defaultInterest=$defaultInterest, timezone=$timezone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.defaultMonthlyFee != null) {
      json[r'defaultMonthlyFee'] = this.defaultMonthlyFee;
    } else {
      json[r'defaultMonthlyFee'] = null;
    }
    if (this.defaultBillingDay != null) {
      json[r'defaultBillingDay'] = this.defaultBillingDay;
    } else {
      json[r'defaultBillingDay'] = null;
    }
    if (this.defaultInterest != null) {
      json[r'defaultInterest'] = this.defaultInterest;
    } else {
      json[r'defaultInterest'] = null;
    }
    if (this.timezone != null) {
      json[r'timezone'] = this.timezone;
    } else {
      json[r'timezone'] = null;
    }
    return json;
  }

  /// Returns a new [SettingsUpdateRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SettingsUpdateRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return SettingsUpdateRequest(
        defaultMonthlyFee: mapValueOfType<int>(json, r'defaultMonthlyFee'),
        defaultBillingDay: mapValueOfType<int>(json, r'defaultBillingDay'),
        defaultInterest: SimpleInterestParams.fromJson(json[r'defaultInterest']),
        timezone: mapValueOfType<String>(json, r'timezone'),
      );
    }
    return null;
  }

  static List<SettingsUpdateRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SettingsUpdateRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SettingsUpdateRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SettingsUpdateRequest> mapFromJson(dynamic json) {
    final map = <String, SettingsUpdateRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SettingsUpdateRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SettingsUpdateRequest-objects as value to a dart map
  static Map<String, List<SettingsUpdateRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SettingsUpdateRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SettingsUpdateRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

