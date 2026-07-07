//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FieldViolation {
  /// Returns a new [FieldViolation] instance.
  FieldViolation({
    required this.field,
    required this.message,
  });

  /// Caminho do campo violado no payload, em camelCase (ex.: `whatsapp`, `tokens.refreshToken`).
  String field;

  /// Mensagem legível (pt-BR) descrevendo a violação.
  String message;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FieldViolation &&
    other.field == field &&
    other.message == message;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (field.hashCode) +
    (message.hashCode);

  @override
  String toString() => 'FieldViolation[field=$field, message=$message]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'field'] = this.field;
      json[r'message'] = this.message;
    return json;
  }

  /// Returns a new [FieldViolation] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FieldViolation? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'field'), 'Required key "FieldViolation[field]" is missing from JSON.');
        assert(json[r'field'] != null, 'Required key "FieldViolation[field]" has a null value in JSON.');
        assert(json.containsKey(r'message'), 'Required key "FieldViolation[message]" is missing from JSON.');
        assert(json[r'message'] != null, 'Required key "FieldViolation[message]" has a null value in JSON.');
        return true;
      }());

      return FieldViolation(
        field: mapValueOfType<String>(json, r'field')!,
        message: mapValueOfType<String>(json, r'message')!,
      );
    }
    return null;
  }

  static List<FieldViolation> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FieldViolation>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FieldViolation.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FieldViolation> mapFromJson(dynamic json) {
    final map = <String, FieldViolation>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FieldViolation.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FieldViolation-objects as value to a dart map
  static Map<String, List<FieldViolation>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FieldViolation>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FieldViolation.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'field',
    'message',
  };
}

