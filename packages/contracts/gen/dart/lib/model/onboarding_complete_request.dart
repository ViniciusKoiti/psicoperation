//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OnboardingCompleteRequest {
  /// Returns a new [OnboardingCompleteRequest] instance.
  OnboardingCompleteRequest({
    required this.stepKey,
  });

  /// Passo a marcar como concluído.
  String stepKey;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OnboardingCompleteRequest &&
    other.stepKey == stepKey;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (stepKey.hashCode);

  @override
  String toString() => 'OnboardingCompleteRequest[stepKey=$stepKey]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'stepKey'] = this.stepKey;
    return json;
  }

  /// Returns a new [OnboardingCompleteRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OnboardingCompleteRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'stepKey'), 'Required key "OnboardingCompleteRequest[stepKey]" is missing from JSON.');
        assert(json[r'stepKey'] != null, 'Required key "OnboardingCompleteRequest[stepKey]" has a null value in JSON.');
        return true;
      }());

      return OnboardingCompleteRequest(
        stepKey: mapValueOfType<String>(json, r'stepKey')!,
      );
    }
    return null;
  }

  static List<OnboardingCompleteRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OnboardingCompleteRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OnboardingCompleteRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OnboardingCompleteRequest> mapFromJson(dynamic json) {
    final map = <String, OnboardingCompleteRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OnboardingCompleteRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OnboardingCompleteRequest-objects as value to a dart map
  static Map<String, List<OnboardingCompleteRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OnboardingCompleteRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OnboardingCompleteRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'stepKey',
  };
}

