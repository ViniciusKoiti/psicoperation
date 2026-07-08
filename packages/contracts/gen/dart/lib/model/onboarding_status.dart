//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OnboardingStatus {
  /// Returns a new [OnboardingStatus] instance.
  OnboardingStatus({
    required this.completed,
    this.steps = const [],
  });

  /// Se o onboarding foi concluído.
  bool completed;

  /// Passos do onboarding e sua conclusão.
  List<OnboardingStep> steps;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OnboardingStatus &&
    other.completed == completed &&
    _deepEquality.equals(other.steps, steps);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (completed.hashCode) +
    (steps.hashCode);

  @override
  String toString() => 'OnboardingStatus[completed=$completed, steps=$steps]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'completed'] = this.completed;
      json[r'steps'] = this.steps;
    return json;
  }

  /// Returns a new [OnboardingStatus] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OnboardingStatus? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'completed'), 'Required key "OnboardingStatus[completed]" is missing from JSON.');
        assert(json[r'completed'] != null, 'Required key "OnboardingStatus[completed]" has a null value in JSON.');
        assert(json.containsKey(r'steps'), 'Required key "OnboardingStatus[steps]" is missing from JSON.');
        assert(json[r'steps'] != null, 'Required key "OnboardingStatus[steps]" has a null value in JSON.');
        return true;
      }());

      return OnboardingStatus(
        completed: mapValueOfType<bool>(json, r'completed')!,
        steps: OnboardingStep.listFromJson(json[r'steps']),
      );
    }
    return null;
  }

  static List<OnboardingStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OnboardingStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OnboardingStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OnboardingStatus> mapFromJson(dynamic json) {
    final map = <String, OnboardingStatus>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OnboardingStatus.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OnboardingStatus-objects as value to a dart map
  static Map<String, List<OnboardingStatus>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OnboardingStatus>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OnboardingStatus.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'completed',
    'steps',
  };
}

