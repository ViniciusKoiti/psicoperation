//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GetCurrentSession200Response {
  /// Returns a new [GetCurrentSession200Response] instance.
  GetCurrentSession200Response({
    required this.user,
    required this.expiresAt,
  });

  RegisterUser201ResponseUser user;

  /// Instante de expiração do access token corrente (ISO 8601, UTC).
  DateTime expiresAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GetCurrentSession200Response &&
    other.user == user &&
    other.expiresAt == expiresAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (user.hashCode) +
    (expiresAt.hashCode);

  @override
  String toString() => 'GetCurrentSession200Response[user=$user, expiresAt=$expiresAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'user'] = this.user;
      json[r'expiresAt'] = this.expiresAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [GetCurrentSession200Response] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GetCurrentSession200Response? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'user'), 'Required key "GetCurrentSession200Response[user]" is missing from JSON.');
        assert(json[r'user'] != null, 'Required key "GetCurrentSession200Response[user]" has a null value in JSON.');
        assert(json.containsKey(r'expiresAt'), 'Required key "GetCurrentSession200Response[expiresAt]" is missing from JSON.');
        assert(json[r'expiresAt'] != null, 'Required key "GetCurrentSession200Response[expiresAt]" has a null value in JSON.');
        return true;
      }());

      return GetCurrentSession200Response(
        user: RegisterUser201ResponseUser.fromJson(json[r'user'])!,
        expiresAt: mapDateTime(json, r'expiresAt', r'')!,
      );
    }
    return null;
  }

  static List<GetCurrentSession200Response> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GetCurrentSession200Response>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GetCurrentSession200Response.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GetCurrentSession200Response> mapFromJson(dynamic json) {
    final map = <String, GetCurrentSession200Response>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GetCurrentSession200Response.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GetCurrentSession200Response-objects as value to a dart map
  static Map<String, List<GetCurrentSession200Response>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GetCurrentSession200Response>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GetCurrentSession200Response.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'user',
    'expiresAt',
  };
}

