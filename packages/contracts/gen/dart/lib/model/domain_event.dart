//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DomainEvent {
  /// Returns a new [DomainEvent] instance.
  DomainEvent({
    required this.eventId,
    required this.type,
    required this.occurredAt,
    required this.userId,
    this.payload = const {},
  });

  /// Identificador único do evento (idempotência).
  String eventId;

  /// Tipo do evento no formato `<recurso>.<fato>`.
  String type;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime occurredAt;

  /// Tenant (psicóloga) dona do fato.
  String userId;

  /// Dado específico do tipo de evento.
  Map<String, Object> payload;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DomainEvent &&
    other.eventId == eventId &&
    other.type == type &&
    other.occurredAt == occurredAt &&
    other.userId == userId &&
    _deepEquality.equals(other.payload, payload);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (eventId.hashCode) +
    (type.hashCode) +
    (occurredAt.hashCode) +
    (userId.hashCode) +
    (payload.hashCode);

  @override
  String toString() => 'DomainEvent[eventId=$eventId, type=$type, occurredAt=$occurredAt, userId=$userId, payload=$payload]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'eventId'] = this.eventId;
      json[r'type'] = this.type;
      json[r'occurredAt'] = this.occurredAt.toUtc().toIso8601String();
      json[r'userId'] = this.userId;
      json[r'payload'] = this.payload;
    return json;
  }

  /// Returns a new [DomainEvent] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DomainEvent? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'eventId'), 'Required key "DomainEvent[eventId]" is missing from JSON.');
        assert(json[r'eventId'] != null, 'Required key "DomainEvent[eventId]" has a null value in JSON.');
        assert(json.containsKey(r'type'), 'Required key "DomainEvent[type]" is missing from JSON.');
        assert(json[r'type'] != null, 'Required key "DomainEvent[type]" has a null value in JSON.');
        assert(json.containsKey(r'occurredAt'), 'Required key "DomainEvent[occurredAt]" is missing from JSON.');
        assert(json[r'occurredAt'] != null, 'Required key "DomainEvent[occurredAt]" has a null value in JSON.');
        assert(json.containsKey(r'userId'), 'Required key "DomainEvent[userId]" is missing from JSON.');
        assert(json[r'userId'] != null, 'Required key "DomainEvent[userId]" has a null value in JSON.');
        assert(json.containsKey(r'payload'), 'Required key "DomainEvent[payload]" is missing from JSON.');
        assert(json[r'payload'] != null, 'Required key "DomainEvent[payload]" has a null value in JSON.');
        return true;
      }());

      return DomainEvent(
        eventId: mapValueOfType<String>(json, r'eventId')!,
        type: mapValueOfType<String>(json, r'type')!,
        occurredAt: mapDateTime(json, r'occurredAt', r'')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        payload: mapCastOfType<String, Object>(json, r'payload')!,
      );
    }
    return null;
  }

  static List<DomainEvent> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DomainEvent>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DomainEvent.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DomainEvent> mapFromJson(dynamic json) {
    final map = <String, DomainEvent>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DomainEvent.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DomainEvent-objects as value to a dart map
  static Map<String, List<DomainEvent>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DomainEvent>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DomainEvent.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'eventId',
    'type',
    'occurredAt',
    'userId',
    'payload',
  };
}

