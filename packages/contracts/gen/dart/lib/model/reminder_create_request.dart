//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ReminderCreateRequest {
  /// Returns a new [ReminderCreateRequest] instance.
  ReminderCreateRequest({
    required this.channel,
    required this.subject,
    required this.body,
    required this.scheduledFor,
    this.patientId,
    this.appointmentId,
    this.chargeId,
  });

  ReminderChannel channel;

  String subject;

  String body;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime scheduledFor;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? patientId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? appointmentId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? chargeId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ReminderCreateRequest &&
    other.channel == channel &&
    other.subject == subject &&
    other.body == body &&
    other.scheduledFor == scheduledFor &&
    other.patientId == patientId &&
    other.appointmentId == appointmentId &&
    other.chargeId == chargeId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (channel.hashCode) +
    (subject.hashCode) +
    (body.hashCode) +
    (scheduledFor.hashCode) +
    (patientId == null ? 0 : patientId!.hashCode) +
    (appointmentId == null ? 0 : appointmentId!.hashCode) +
    (chargeId == null ? 0 : chargeId!.hashCode);

  @override
  String toString() => 'ReminderCreateRequest[channel=$channel, subject=$subject, body=$body, scheduledFor=$scheduledFor, patientId=$patientId, appointmentId=$appointmentId, chargeId=$chargeId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'channel'] = this.channel;
      json[r'subject'] = this.subject;
      json[r'body'] = this.body;
      json[r'scheduledFor'] = this.scheduledFor.toUtc().toIso8601String();
    if (this.patientId != null) {
      json[r'patientId'] = this.patientId;
    } else {
      json[r'patientId'] = null;
    }
    if (this.appointmentId != null) {
      json[r'appointmentId'] = this.appointmentId;
    } else {
      json[r'appointmentId'] = null;
    }
    if (this.chargeId != null) {
      json[r'chargeId'] = this.chargeId;
    } else {
      json[r'chargeId'] = null;
    }
    return json;
  }

  /// Returns a new [ReminderCreateRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ReminderCreateRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'channel'), 'Required key "ReminderCreateRequest[channel]" is missing from JSON.');
        assert(json[r'channel'] != null, 'Required key "ReminderCreateRequest[channel]" has a null value in JSON.');
        assert(json.containsKey(r'subject'), 'Required key "ReminderCreateRequest[subject]" is missing from JSON.');
        assert(json[r'subject'] != null, 'Required key "ReminderCreateRequest[subject]" has a null value in JSON.');
        assert(json.containsKey(r'body'), 'Required key "ReminderCreateRequest[body]" is missing from JSON.');
        assert(json[r'body'] != null, 'Required key "ReminderCreateRequest[body]" has a null value in JSON.');
        assert(json.containsKey(r'scheduledFor'), 'Required key "ReminderCreateRequest[scheduledFor]" is missing from JSON.');
        assert(json[r'scheduledFor'] != null, 'Required key "ReminderCreateRequest[scheduledFor]" has a null value in JSON.');
        return true;
      }());

      return ReminderCreateRequest(
        channel: ReminderChannel.fromJson(json[r'channel'])!,
        subject: mapValueOfType<String>(json, r'subject')!,
        body: mapValueOfType<String>(json, r'body')!,
        scheduledFor: mapDateTime(json, r'scheduledFor', r'')!,
        patientId: mapValueOfType<String>(json, r'patientId'),
        appointmentId: mapValueOfType<String>(json, r'appointmentId'),
        chargeId: mapValueOfType<String>(json, r'chargeId'),
      );
    }
    return null;
  }

  static List<ReminderCreateRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReminderCreateRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReminderCreateRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ReminderCreateRequest> mapFromJson(dynamic json) {
    final map = <String, ReminderCreateRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ReminderCreateRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ReminderCreateRequest-objects as value to a dart map
  static Map<String, List<ReminderCreateRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ReminderCreateRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ReminderCreateRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'channel',
    'subject',
    'body',
    'scheduledFor',
  };
}

