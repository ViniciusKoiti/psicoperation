//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ReminderDuePayload {
  /// Returns a new [ReminderDuePayload] instance.
  ReminderDuePayload({
    required this.reminderId,
    required this.channel,
    required this.scheduledFor,
    this.patientId,
  });

  String reminderId;

  ReminderChannel channel;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime scheduledFor;

  /// Paciente vinculado (opcional).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? patientId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ReminderDuePayload &&
    other.reminderId == reminderId &&
    other.channel == channel &&
    other.scheduledFor == scheduledFor &&
    other.patientId == patientId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (reminderId.hashCode) +
    (channel.hashCode) +
    (scheduledFor.hashCode) +
    (patientId == null ? 0 : patientId!.hashCode);

  @override
  String toString() => 'ReminderDuePayload[reminderId=$reminderId, channel=$channel, scheduledFor=$scheduledFor, patientId=$patientId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'reminderId'] = this.reminderId;
      json[r'channel'] = this.channel;
      json[r'scheduledFor'] = this.scheduledFor.toUtc().toIso8601String();
    if (this.patientId != null) {
      json[r'patientId'] = this.patientId;
    } else {
      json[r'patientId'] = null;
    }
    return json;
  }

  /// Returns a new [ReminderDuePayload] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ReminderDuePayload? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'reminderId'), 'Required key "ReminderDuePayload[reminderId]" is missing from JSON.');
        assert(json[r'reminderId'] != null, 'Required key "ReminderDuePayload[reminderId]" has a null value in JSON.');
        assert(json.containsKey(r'channel'), 'Required key "ReminderDuePayload[channel]" is missing from JSON.');
        assert(json[r'channel'] != null, 'Required key "ReminderDuePayload[channel]" has a null value in JSON.');
        assert(json.containsKey(r'scheduledFor'), 'Required key "ReminderDuePayload[scheduledFor]" is missing from JSON.');
        assert(json[r'scheduledFor'] != null, 'Required key "ReminderDuePayload[scheduledFor]" has a null value in JSON.');
        return true;
      }());

      return ReminderDuePayload(
        reminderId: mapValueOfType<String>(json, r'reminderId')!,
        channel: ReminderChannel.fromJson(json[r'channel'])!,
        scheduledFor: mapDateTime(json, r'scheduledFor', r'')!,
        patientId: mapValueOfType<String>(json, r'patientId'),
      );
    }
    return null;
  }

  static List<ReminderDuePayload> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReminderDuePayload>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReminderDuePayload.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ReminderDuePayload> mapFromJson(dynamic json) {
    final map = <String, ReminderDuePayload>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ReminderDuePayload.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ReminderDuePayload-objects as value to a dart map
  static Map<String, List<ReminderDuePayload>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ReminderDuePayload>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ReminderDuePayload.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'reminderId',
    'channel',
    'scheduledFor',
  };
}

