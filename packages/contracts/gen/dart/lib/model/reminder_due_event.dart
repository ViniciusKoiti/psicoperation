//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ReminderDueEvent {
  /// Returns a new [ReminderDueEvent] instance.
  ReminderDueEvent({
    required this.eventId,
    required this.type,
    required this.occurredAt,
    required this.userId,
    required this.payload,
  });

  /// Identificador único do evento (idempotência).
  String eventId;

  ReminderDueEventTypeEnum type;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime occurredAt;

  /// Tenant (psicóloga) dona do fato.
  String userId;

  ReminderDuePayload payload;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ReminderDueEvent &&
    other.eventId == eventId &&
    other.type == type &&
    other.occurredAt == occurredAt &&
    other.userId == userId &&
    other.payload == payload;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (eventId.hashCode) +
    (type.hashCode) +
    (occurredAt.hashCode) +
    (userId.hashCode) +
    (payload.hashCode);

  @override
  String toString() => 'ReminderDueEvent[eventId=$eventId, type=$type, occurredAt=$occurredAt, userId=$userId, payload=$payload]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'eventId'] = this.eventId;
      json[r'type'] = this.type;
      json[r'occurredAt'] = this.occurredAt.toUtc().toIso8601String();
      json[r'userId'] = this.userId;
      json[r'payload'] = this.payload;
    return json;
  }

  /// Returns a new [ReminderDueEvent] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ReminderDueEvent? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'eventId'), 'Required key "ReminderDueEvent[eventId]" is missing from JSON.');
        assert(json[r'eventId'] != null, 'Required key "ReminderDueEvent[eventId]" has a null value in JSON.');
        assert(json.containsKey(r'type'), 'Required key "ReminderDueEvent[type]" is missing from JSON.');
        assert(json[r'type'] != null, 'Required key "ReminderDueEvent[type]" has a null value in JSON.');
        assert(json.containsKey(r'occurredAt'), 'Required key "ReminderDueEvent[occurredAt]" is missing from JSON.');
        assert(json[r'occurredAt'] != null, 'Required key "ReminderDueEvent[occurredAt]" has a null value in JSON.');
        assert(json.containsKey(r'userId'), 'Required key "ReminderDueEvent[userId]" is missing from JSON.');
        assert(json[r'userId'] != null, 'Required key "ReminderDueEvent[userId]" has a null value in JSON.');
        assert(json.containsKey(r'payload'), 'Required key "ReminderDueEvent[payload]" is missing from JSON.');
        assert(json[r'payload'] != null, 'Required key "ReminderDueEvent[payload]" has a null value in JSON.');
        return true;
      }());

      return ReminderDueEvent(
        eventId: mapValueOfType<String>(json, r'eventId')!,
        type: ReminderDueEventTypeEnum.fromJson(json[r'type'])!,
        occurredAt: mapDateTime(json, r'occurredAt', r'')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        payload: ReminderDuePayload.fromJson(json[r'payload'])!,
      );
    }
    return null;
  }

  static List<ReminderDueEvent> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReminderDueEvent>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReminderDueEvent.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ReminderDueEvent> mapFromJson(dynamic json) {
    final map = <String, ReminderDueEvent>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ReminderDueEvent.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ReminderDueEvent-objects as value to a dart map
  static Map<String, List<ReminderDueEvent>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ReminderDueEvent>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ReminderDueEvent.listFromJson(entry.value, growable: growable,);
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


class ReminderDueEventTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const ReminderDueEventTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const lembretePeriodDevido = ReminderDueEventTypeEnum._(r'lembrete.devido');

  /// List of all possible values in this [enum][ReminderDueEventTypeEnum].
  static const values = <ReminderDueEventTypeEnum>[
    lembretePeriodDevido,
  ];

  static ReminderDueEventTypeEnum? fromJson(dynamic value) => ReminderDueEventTypeEnumTypeTransformer().decode(value);

  static List<ReminderDueEventTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReminderDueEventTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReminderDueEventTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ReminderDueEventTypeEnum] to String,
/// and [decode] dynamic data back to [ReminderDueEventTypeEnum].
class ReminderDueEventTypeEnumTypeTransformer {
  factory ReminderDueEventTypeEnumTypeTransformer() => _instance ??= const ReminderDueEventTypeEnumTypeTransformer._();

  const ReminderDueEventTypeEnumTypeTransformer._();

  String encode(ReminderDueEventTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ReminderDueEventTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ReminderDueEventTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'lembrete.devido': return ReminderDueEventTypeEnum.lembretePeriodDevido;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ReminderDueEventTypeEnumTypeTransformer] instance.
  static ReminderDueEventTypeEnumTypeTransformer? _instance;
}


