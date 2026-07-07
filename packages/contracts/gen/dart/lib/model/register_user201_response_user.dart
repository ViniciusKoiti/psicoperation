//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RegisterUser201ResponseUser {
  /// Returns a new [RegisterUser201ResponseUser] instance.
  RegisterUser201ResponseUser({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
  });

  /// Identificador único da conta.
  String id;

  /// Nome completo.
  String name;

  /// E-mail de login (único por conta).
  String email;

  /// Instante de criação da conta (ISO 8601, UTC).
  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RegisterUser201ResponseUser &&
    other.id == id &&
    other.name == name &&
    other.email == email &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode) +
    (email.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'RegisterUser201ResponseUser[id=$id, name=$name, email=$email, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'email'] = this.email;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [RegisterUser201ResponseUser] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RegisterUser201ResponseUser? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "RegisterUser201ResponseUser[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "RegisterUser201ResponseUser[id]" has a null value in JSON.');
        assert(json.containsKey(r'name'), 'Required key "RegisterUser201ResponseUser[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "RegisterUser201ResponseUser[name]" has a null value in JSON.');
        assert(json.containsKey(r'email'), 'Required key "RegisterUser201ResponseUser[email]" is missing from JSON.');
        assert(json[r'email'] != null, 'Required key "RegisterUser201ResponseUser[email]" has a null value in JSON.');
        assert(json.containsKey(r'createdAt'), 'Required key "RegisterUser201ResponseUser[createdAt]" is missing from JSON.');
        assert(json[r'createdAt'] != null, 'Required key "RegisterUser201ResponseUser[createdAt]" has a null value in JSON.');
        return true;
      }());

      return RegisterUser201ResponseUser(
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        email: mapValueOfType<String>(json, r'email')!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
      );
    }
    return null;
  }

  static List<RegisterUser201ResponseUser> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RegisterUser201ResponseUser>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RegisterUser201ResponseUser.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RegisterUser201ResponseUser> mapFromJson(dynamic json) {
    final map = <String, RegisterUser201ResponseUser>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RegisterUser201ResponseUser.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RegisterUser201ResponseUser-objects as value to a dart map
  static Map<String, List<RegisterUser201ResponseUser>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RegisterUser201ResponseUser>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RegisterUser201ResponseUser.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'email',
    'createdAt',
  };
}

