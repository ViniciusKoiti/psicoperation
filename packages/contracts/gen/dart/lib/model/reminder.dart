//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class Reminder {
  /// Returns a new [Reminder] instance.
  Reminder({
    required this.id,
    required this.channel,
    required this.subject,
    required this.body,
    required this.scheduledFor,
    this.sentAt,
    required this.status,
    this.patientId,
    this.appointmentId,
    this.chargeId,
    required this.createdAt,
  });

  String id;

  ReminderChannel channel;

  /// Assunto/título do lembrete.
  String subject;

  /// Corpo do lembrete (texto administrativo).
  String body;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime scheduledFor;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? sentAt;

  ReminderStatus status;

  /// Paciente vinculado (opcional).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? patientId;

  /// Consulta vinculada (opcional).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? appointmentId;

  /// Cobrança vinculada (opcional).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? chargeId;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is Reminder &&
    other.id == id &&
    other.channel == channel &&
    other.subject == subject &&
    other.body == body &&
    other.scheduledFor == scheduledFor &&
    other.sentAt == sentAt &&
    other.status == status &&
    other.patientId == patientId &&
    other.appointmentId == appointmentId &&
    other.chargeId == chargeId &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (channel.hashCode) +
    (subject.hashCode) +
    (body.hashCode) +
    (scheduledFor.hashCode) +
    (sentAt == null ? 0 : sentAt!.hashCode) +
    (status.hashCode) +
    (patientId == null ? 0 : patientId!.hashCode) +
    (appointmentId == null ? 0 : appointmentId!.hashCode) +
    (chargeId == null ? 0 : chargeId!.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'Reminder[id=$id, channel=$channel, subject=$subject, body=$body, scheduledFor=$scheduledFor, sentAt=$sentAt, status=$status, patientId=$patientId, appointmentId=$appointmentId, chargeId=$chargeId, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'channel'] = this.channel;
      json[r'subject'] = this.subject;
      json[r'body'] = this.body;
      json[r'scheduledFor'] = this.scheduledFor.toUtc().toIso8601String();
    if (this.sentAt != null) {
      json[r'sentAt'] = this.sentAt!.toUtc().toIso8601String();
    } else {
      json[r'sentAt'] = null;
    }
      json[r'status'] = this.status;
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
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [Reminder] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static Reminder? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "Reminder[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "Reminder[id]" has a null value in JSON.');
        assert(json.containsKey(r'channel'), 'Required key "Reminder[channel]" is missing from JSON.');
        assert(json[r'channel'] != null, 'Required key "Reminder[channel]" has a null value in JSON.');
        assert(json.containsKey(r'subject'), 'Required key "Reminder[subject]" is missing from JSON.');
        assert(json[r'subject'] != null, 'Required key "Reminder[subject]" has a null value in JSON.');
        assert(json.containsKey(r'body'), 'Required key "Reminder[body]" is missing from JSON.');
        assert(json[r'body'] != null, 'Required key "Reminder[body]" has a null value in JSON.');
        assert(json.containsKey(r'scheduledFor'), 'Required key "Reminder[scheduledFor]" is missing from JSON.');
        assert(json[r'scheduledFor'] != null, 'Required key "Reminder[scheduledFor]" has a null value in JSON.');
        assert(json.containsKey(r'status'), 'Required key "Reminder[status]" is missing from JSON.');
        assert(json[r'status'] != null, 'Required key "Reminder[status]" has a null value in JSON.');
        assert(json.containsKey(r'createdAt'), 'Required key "Reminder[createdAt]" is missing from JSON.');
        assert(json[r'createdAt'] != null, 'Required key "Reminder[createdAt]" has a null value in JSON.');
        return true;
      }());

      return Reminder(
        id: mapValueOfType<String>(json, r'id')!,
        channel: ReminderChannel.fromJson(json[r'channel'])!,
        subject: mapValueOfType<String>(json, r'subject')!,
        body: mapValueOfType<String>(json, r'body')!,
        scheduledFor: mapDateTime(json, r'scheduledFor', r'')!,
        sentAt: mapDateTime(json, r'sentAt', r''),
        status: ReminderStatus.fromJson(json[r'status'])!,
        patientId: mapValueOfType<String>(json, r'patientId'),
        appointmentId: mapValueOfType<String>(json, r'appointmentId'),
        chargeId: mapValueOfType<String>(json, r'chargeId'),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
      );
    }
    return null;
  }

  static List<Reminder> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Reminder>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Reminder.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, Reminder> mapFromJson(dynamic json) {
    final map = <String, Reminder>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = Reminder.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of Reminder-objects as value to a dart map
  static Map<String, List<Reminder>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<Reminder>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = Reminder.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'channel',
    'subject',
    'body',
    'scheduledFor',
    'status',
    'createdAt',
  };
}

