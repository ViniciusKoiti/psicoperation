//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RegisterUserRequest {
  /// Returns a new [RegisterUserRequest] instance.
  RegisterUserRequest({
    required this.name,
    required this.email,
    required this.password,
  });

  /// Nome completo.
  String name;

  /// E-mail de login (único por conta).
  String email;

  /// Senha em texto claro (transporte sempre via TLS). Mínimo de 8 caracteres; máximo de 72 bytes (limite do BCrypt usado no backend).
  String password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RegisterUserRequest &&
    other.name == name &&
    other.email == email &&
    other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (email.hashCode) +
    (password.hashCode);

  @override
  String toString() => 'RegisterUserRequest[name=$name, email=$email, password=$password]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
      json[r'email'] = this.email;
      json[r'password'] = this.password;
    return json;
  }

  /// Returns a new [RegisterUserRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RegisterUserRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "RegisterUserRequest[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "RegisterUserRequest[name]" has a null value in JSON.');
        assert(json.containsKey(r'email'), 'Required key "RegisterUserRequest[email]" is missing from JSON.');
        assert(json[r'email'] != null, 'Required key "RegisterUserRequest[email]" has a null value in JSON.');
        assert(json.containsKey(r'password'), 'Required key "RegisterUserRequest[password]" is missing from JSON.');
        assert(json[r'password'] != null, 'Required key "RegisterUserRequest[password]" has a null value in JSON.');
        return true;
      }());

      return RegisterUserRequest(
        name: mapValueOfType<String>(json, r'name')!,
        email: mapValueOfType<String>(json, r'email')!,
        password: mapValueOfType<String>(json, r'password')!,
      );
    }
    return null;
  }

  static List<RegisterUserRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RegisterUserRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RegisterUserRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RegisterUserRequest> mapFromJson(dynamic json) {
    final map = <String, RegisterUserRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RegisterUserRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RegisterUserRequest-objects as value to a dart map
  static Map<String, List<RegisterUserRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RegisterUserRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RegisterUserRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'email',
    'password',
  };
}

