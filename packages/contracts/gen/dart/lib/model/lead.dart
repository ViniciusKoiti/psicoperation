//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class Lead {
  /// Returns a new [Lead] instance.
  Lead({
    required this.id,
    required this.name,
    required this.whatsapp,
    required this.email,
    required this.createdAt,
  });

  /// Identificador único do lead.
  String id;

  String name;

  /// Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
  String whatsapp;

  String email;

  /// Instante de entrada na lista de espera (ISO 8601, UTC).
  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is Lead &&
    other.id == id &&
    other.name == name &&
    other.whatsapp == whatsapp &&
    other.email == email &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode) +
    (whatsapp.hashCode) +
    (email.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'Lead[id=$id, name=$name, whatsapp=$whatsapp, email=$email, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'whatsapp'] = this.whatsapp;
      json[r'email'] = this.email;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [Lead] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static Lead? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "Lead[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "Lead[id]" has a null value in JSON.');
        assert(json.containsKey(r'name'), 'Required key "Lead[name]" is missing from JSON.');
        assert(json[r'name'] != null, 'Required key "Lead[name]" has a null value in JSON.');
        assert(json.containsKey(r'whatsapp'), 'Required key "Lead[whatsapp]" is missing from JSON.');
        assert(json[r'whatsapp'] != null, 'Required key "Lead[whatsapp]" has a null value in JSON.');
        assert(json.containsKey(r'email'), 'Required key "Lead[email]" is missing from JSON.');
        assert(json[r'email'] != null, 'Required key "Lead[email]" has a null value in JSON.');
        assert(json.containsKey(r'createdAt'), 'Required key "Lead[createdAt]" is missing from JSON.');
        assert(json[r'createdAt'] != null, 'Required key "Lead[createdAt]" has a null value in JSON.');
        return true;
      }());

      return Lead(
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        whatsapp: mapValueOfType<String>(json, r'whatsapp')!,
        email: mapValueOfType<String>(json, r'email')!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
      );
    }
    return null;
  }

  static List<Lead> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Lead>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Lead.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, Lead> mapFromJson(dynamic json) {
    final map = <String, Lead>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = Lead.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of Lead-objects as value to a dart map
  static Map<String, List<Lead>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<Lead>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = Lead.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'whatsapp',
    'email',
    'createdAt',
  };
}

