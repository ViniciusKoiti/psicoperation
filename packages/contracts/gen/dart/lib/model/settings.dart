//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class Settings {
  /// Returns a new [Settings] instance.
  Settings({
    this.defaultMonthlyFee,
    this.defaultBillingDay,
    this.defaultInterest,
    required this.timezone,
    this.onboardingCompletedAt,
    this.updatedAt,
  });

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? defaultMonthlyFee;

  /// Dia de vencimento padrão para novas mensalidades.
  ///
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

  /// Fuso IANA para exibição (ex.: `America/Sao_Paulo`). O backend sempre armazena/emite em UTC; este campo orienta apenas a apresentação.
  String timezone;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? onboardingCompletedAt;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is Settings &&
    other.defaultMonthlyFee == defaultMonthlyFee &&
    other.defaultBillingDay == defaultBillingDay &&
    other.defaultInterest == defaultInterest &&
    other.timezone == timezone &&
    other.onboardingCompletedAt == onboardingCompletedAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (defaultMonthlyFee == null ? 0 : defaultMonthlyFee!.hashCode) +
    (defaultBillingDay == null ? 0 : defaultBillingDay!.hashCode) +
    (defaultInterest == null ? 0 : defaultInterest!.hashCode) +
    (timezone.hashCode) +
    (onboardingCompletedAt == null ? 0 : onboardingCompletedAt!.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode);

  @override
  String toString() => 'Settings[defaultMonthlyFee=$defaultMonthlyFee, defaultBillingDay=$defaultBillingDay, defaultInterest=$defaultInterest, timezone=$timezone, onboardingCompletedAt=$onboardingCompletedAt, updatedAt=$updatedAt]';

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
      json[r'timezone'] = this.timezone;
    if (this.onboardingCompletedAt != null) {
      json[r'onboardingCompletedAt'] = this.onboardingCompletedAt!.toUtc().toIso8601String();
    } else {
      json[r'onboardingCompletedAt'] = null;
    }
    if (this.updatedAt != null) {
      json[r'updatedAt'] = this.updatedAt!.toUtc().toIso8601String();
    } else {
      json[r'updatedAt'] = null;
    }
    return json;
  }

  /// Returns a new [Settings] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static Settings? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'timezone'), 'Required key "Settings[timezone]" is missing from JSON.');
        assert(json[r'timezone'] != null, 'Required key "Settings[timezone]" has a null value in JSON.');
        return true;
      }());

      return Settings(
        defaultMonthlyFee: mapValueOfType<int>(json, r'defaultMonthlyFee'),
        defaultBillingDay: mapValueOfType<int>(json, r'defaultBillingDay'),
        defaultInterest: SimpleInterestParams.fromJson(json[r'defaultInterest']),
        timezone: mapValueOfType<String>(json, r'timezone')!,
        onboardingCompletedAt: mapDateTime(json, r'onboardingCompletedAt', r''),
        updatedAt: mapDateTime(json, r'updatedAt', r''),
      );
    }
    return null;
  }

  static List<Settings> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Settings>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Settings.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, Settings> mapFromJson(dynamic json) {
    final map = <String, Settings>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = Settings.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of Settings-objects as value to a dart map
  static Map<String, List<Settings>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<Settings>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = Settings.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'timezone',
  };
}

