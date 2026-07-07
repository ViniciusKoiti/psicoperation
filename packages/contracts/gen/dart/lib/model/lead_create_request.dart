//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LeadCreateRequest {
  /// Returns a new [LeadCreateRequest] instance.
  LeadCreateRequest({
    required this.name,
    required this.whatsapp,
    required this.email,
  });

  /// Nome informado no formulário.
  String name;

  /// Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
  String whatsapp;

  /// E-mail de contato (único na lista de espera).
  String email;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LeadCreateRequest &&
    other.name == name &&
    other.whatsapp == whatsapp &&
    other.email == email;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (whatsapp.hashCode) +
    (email.hashCode);

  @override
  String toString() => 'LeadCreateRequest[name=$name, whatsapp=$whatsapp, email=$email]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'name'] = this.name;
      json[r'whatsapp'] = this.whatsapp;
      json[r'email'] = this.email;
    return json;
  }

  /// Returns a new [LeadCreateRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LeadCreateRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'name'), 'Required key "LeadCreateRequest[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "LeadCreateRequest[name]" has a null value in JSON.');
        assert(json.containsKey(r'whatsapp'), 'Required key "LeadCreateRequest[whatsapp]" is missing from JSON.');
        assert(json[r'whatsapp'] != null, 'Required key "LeadCreateRequest[whatsapp]" has a null value in JSON.');
        assert(json.containsKey(r'email'), 'Required key "LeadCreateRequest[email]" is missing from JSON.');
        assert(json[r'email'] != null, 'Required key "LeadCreateRequest[email]" has a null value in JSON.');
        return true;
      }());

      return LeadCreateRequest(
        name: mapValueOfType<String>(json, r'name')!,
        whatsapp: mapValueOfType<String>(json, r'whatsapp')!,
        email: mapValueOfType<String>(json, r'email')!,
      );
    }
    return null;
  }

  static List<LeadCreateRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LeadCreateRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LeadCreateRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LeadCreateRequest> mapFromJson(dynamic json) {
    final map = <String, LeadCreateRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LeadCreateRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LeadCreateRequest-objects as value to a dart map
  static Map<String, List<LeadCreateRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LeadCreateRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LeadCreateRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'whatsapp',
    'email',
  };
}

