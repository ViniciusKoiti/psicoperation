//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ChargeOverdueEvent {
  /// Returns a new [ChargeOverdueEvent] instance.
  ChargeOverdueEvent({
    required this.eventId,
    required this.type,
    required this.occurredAt,
    required this.userId,
    required this.payload,
  });

  /// Identificador único do evento (idempotência).
  String eventId;

  ChargeOverdueEventTypeEnum type;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime occurredAt;

  /// Tenant (psicóloga) dona do fato.
  String userId;

  ChargeOverduePayload payload;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ChargeOverdueEvent &&
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
  String toString() => 'ChargeOverdueEvent[eventId=$eventId, type=$type, occurredAt=$occurredAt, userId=$userId, payload=$payload]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'eventId'] = this.eventId;
      json[r'type'] = this.type;
      json[r'occurredAt'] = this.occurredAt.toUtc().toIso8601String();
      json[r'userId'] = this.userId;
      json[r'payload'] = this.payload;
    return json;
  }

  /// Returns a new [ChargeOverdueEvent] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ChargeOverdueEvent? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'eventId'), 'Required key "ChargeOverdueEvent[eventId]" is missing from JSON.');
        assert(json[r'eventId'] != null, 'Required key "ChargeOverdueEvent[eventId]" has a null value in JSON.');
        assert(json.containsKey(r'type'), 'Required key "ChargeOverdueEvent[type]" is missing from JSON.');
        assert(json[r'type'] != null, 'Required key "ChargeOverdueEvent[type]" has a null value in JSON.');
        assert(json.containsKey(r'occurredAt'), 'Required key "ChargeOverdueEvent[occurredAt]" is missing from JSON.');
        assert(json[r'occurredAt'] != null, 'Required key "ChargeOverdueEvent[occurredAt]" has a null value in JSON.');
        assert(json.containsKey(r'userId'), 'Required key "ChargeOverdueEvent[userId]" is missing from JSON.');
        assert(json[r'userId'] != null, 'Required key "ChargeOverdueEvent[userId]" has a null value in JSON.');
        assert(json.containsKey(r'payload'), 'Required key "ChargeOverdueEvent[payload]" is missing from JSON.');
        assert(json[r'payload'] != null, 'Required key "ChargeOverdueEvent[payload]" has a null value in JSON.');
        return true;
      }());

      return ChargeOverdueEvent(
        eventId: mapValueOfType<String>(json, r'eventId')!,
        type: ChargeOverdueEventTypeEnum.fromJson(json[r'type'])!,
        occurredAt: mapDateTime(json, r'occurredAt', r'')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        payload: ChargeOverduePayload.fromJson(json[r'payload'])!,
      );
    }
    return null;
  }

  static List<ChargeOverdueEvent> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChargeOverdueEvent>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChargeOverdueEvent.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ChargeOverdueEvent> mapFromJson(dynamic json) {
    final map = <String, ChargeOverdueEvent>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ChargeOverdueEvent.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ChargeOverdueEvent-objects as value to a dart map
  static Map<String, List<ChargeOverdueEvent>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ChargeOverdueEvent>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ChargeOverdueEvent.listFromJson(entry.value, growable: growable,);
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


class ChargeOverdueEventTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const ChargeOverdueEventTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const cobrancaPeriodAtrasada = ChargeOverdueEventTypeEnum._(r'cobranca.atrasada');

  /// List of all possible values in this [enum][ChargeOverdueEventTypeEnum].
  static const values = <ChargeOverdueEventTypeEnum>[
    cobrancaPeriodAtrasada,
  ];

  static ChargeOverdueEventTypeEnum? fromJson(dynamic value) => ChargeOverdueEventTypeEnumTypeTransformer().decode(value);

  static List<ChargeOverdueEventTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChargeOverdueEventTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChargeOverdueEventTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ChargeOverdueEventTypeEnum] to String,
/// and [decode] dynamic data back to [ChargeOverdueEventTypeEnum].
class ChargeOverdueEventTypeEnumTypeTransformer {
  factory ChargeOverdueEventTypeEnumTypeTransformer() => _instance ??= const ChargeOverdueEventTypeEnumTypeTransformer._();

  const ChargeOverdueEventTypeEnumTypeTransformer._();

  String encode(ChargeOverdueEventTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ChargeOverdueEventTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ChargeOverdueEventTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'cobranca.atrasada': return ChargeOverdueEventTypeEnum.cobrancaPeriodAtrasada;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ChargeOverdueEventTypeEnumTypeTransformer] instance.
  static ChargeOverdueEventTypeEnumTypeTransformer? _instance;
}


