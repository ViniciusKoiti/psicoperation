//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SimpleInterestParams {
  /// Returns a new [SimpleInterestParams] instance.
  SimpleInterestParams({
    required this.monthlyRatePercent,
    required this.finePercent,
  });

  /// Percentual de juros ao mês (ex.: 1.0 = 1% a.m.), aplicado de forma linear (simples) por período de atraso.
  ///
  /// Minimum value: 0
  /// Maximum value: 100
  double monthlyRatePercent;

  /// Percentual de multa única aplicada no vencimento (ex.: 2.0 = 2%).
  ///
  /// Minimum value: 0
  /// Maximum value: 100
  double finePercent;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SimpleInterestParams &&
    other.monthlyRatePercent == monthlyRatePercent &&
    other.finePercent == finePercent;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (monthlyRatePercent.hashCode) +
    (finePercent.hashCode);

  @override
  String toString() => 'SimpleInterestParams[monthlyRatePercent=$monthlyRatePercent, finePercent=$finePercent]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'monthlyRatePercent'] = this.monthlyRatePercent;
      json[r'finePercent'] = this.finePercent;
    return json;
  }

  /// Returns a new [SimpleInterestParams] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SimpleInterestParams? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'monthlyRatePercent'), 'Required key "SimpleInterestParams[monthlyRatePercent]" is missing from JSON.');
        assert(json[r'monthlyRatePercent'] != null, 'Required key "SimpleInterestParams[monthlyRatePercent]" has a null value in JSON.');
        assert(json.containsKey(r'finePercent'), 'Required key "SimpleInterestParams[finePercent]" is missing from JSON.');
        assert(json[r'finePercent'] != null, 'Required key "SimpleInterestParams[finePercent]" has a null value in JSON.');
        return true;
      }());

      return SimpleInterestParams(
        monthlyRatePercent: mapValueOfType<double>(json, r'monthlyRatePercent')!,
        finePercent: mapValueOfType<double>(json, r'finePercent')!,
      );
    }
    return null;
  }

  static List<SimpleInterestParams> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SimpleInterestParams>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SimpleInterestParams.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SimpleInterestParams> mapFromJson(dynamic json) {
    final map = <String, SimpleInterestParams>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SimpleInterestParams.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SimpleInterestParams-objects as value to a dart map
  static Map<String, List<SimpleInterestParams>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SimpleInterestParams>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SimpleInterestParams.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'monthlyRatePercent',
    'finePercent',
  };
}

