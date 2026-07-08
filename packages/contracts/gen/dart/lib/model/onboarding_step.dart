//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OnboardingStep {
  /// Returns a new [OnboardingStep] instance.
  OnboardingStep({
    required this.key,
    required this.done,
  });

  /// Identificador do passo (ex.: `perfil`, `primeiro-paciente`).
  String key;

  bool done;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OnboardingStep &&
    other.key == key &&
    other.done == done;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (key.hashCode) +
    (done.hashCode);

  @override
  String toString() => 'OnboardingStep[key=$key, done=$done]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'key'] = this.key;
      json[r'done'] = this.done;
    return json;
  }

  /// Returns a new [OnboardingStep] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OnboardingStep? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'key'), 'Required key "OnboardingStep[key]" is missing from JSON.');
        assert(json[r'key'] != null, 'Required key "OnboardingStep[key]" has a null value in JSON.');
        assert(json.containsKey(r'done'), 'Required key "OnboardingStep[done]" is missing from JSON.');
        assert(json[r'done'] != null, 'Required key "OnboardingStep[done]" has a null value in JSON.');
        return true;
      }());

      return OnboardingStep(
        key: mapValueOfType<String>(json, r'key')!,
        done: mapValueOfType<bool>(json, r'done')!,
      );
    }
    return null;
  }

  static List<OnboardingStep> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OnboardingStep>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OnboardingStep.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OnboardingStep> mapFromJson(dynamic json) {
    final map = <String, OnboardingStep>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OnboardingStep.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OnboardingStep-objects as value to a dart map
  static Map<String, List<OnboardingStep>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OnboardingStep>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OnboardingStep.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'key',
    'done',
  };
}

