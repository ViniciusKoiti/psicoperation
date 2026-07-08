//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class Appointment {
  /// Returns a new [Appointment] instance.
  Appointment({
    required this.id,
    required this.patientId,
    required this.startsAt,
    required this.durationMinutes,
    this.recurrence,
    required this.status,
    required this.createdAt,
  });

  /// Identificador único da consulta.
  String id;

  /// Paciente da consulta.
  String patientId;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime startsAt;

  /// Duração da consulta em minutos.
  ///
  /// Minimum value: 1
  /// Maximum value: 480
  int durationMinutes;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  WeeklyRecurrence? recurrence;

  AppointmentStatus status;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime createdAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is Appointment &&
    other.id == id &&
    other.patientId == patientId &&
    other.startsAt == startsAt &&
    other.durationMinutes == durationMinutes &&
    other.recurrence == recurrence &&
    other.status == status &&
    other.createdAt == createdAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (patientId.hashCode) +
    (startsAt.hashCode) +
    (durationMinutes.hashCode) +
    (recurrence == null ? 0 : recurrence!.hashCode) +
    (status.hashCode) +
    (createdAt.hashCode);

  @override
  String toString() => 'Appointment[id=$id, patientId=$patientId, startsAt=$startsAt, durationMinutes=$durationMinutes, recurrence=$recurrence, status=$status, createdAt=$createdAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'patientId'] = this.patientId;
      json[r'startsAt'] = this.startsAt.toUtc().toIso8601String();
      json[r'durationMinutes'] = this.durationMinutes;
    if (this.recurrence != null) {
      json[r'recurrence'] = this.recurrence;
    } else {
      json[r'recurrence'] = null;
    }
      json[r'status'] = this.status;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [Appointment] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static Appointment? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'id'), 'Required key "Appointment[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "Appointment[id]" has a null value in JSON.');
        assert(json.containsKey(r'patientId'), 'Required key "Appointment[patientId]" is missing from JSON.');
        assert(json[r'patientId'] != null, 'Required key "Appointment[patientId]" has a null value in JSON.');
        assert(json.containsKey(r'startsAt'), 'Required key "Appointment[startsAt]" is missing from JSON.');
        assert(json[r'startsAt'] != null, 'Required key "Appointment[startsAt]" has a null value in JSON.');
        assert(json.containsKey(r'durationMinutes'), 'Required key "Appointment[durationMinutes]" is missing from JSON.');
        assert(json[r'durationMinutes'] != null, 'Required key "Appointment[durationMinutes]" has a null value in JSON.');
        assert(json.containsKey(r'status'), 'Required key "Appointment[status]" is missing from JSON.');
        assert(json[r'status'] != null, 'Required key "Appointment[status]" has a null value in JSON.');
        assert(json.containsKey(r'createdAt'), 'Required key "Appointment[createdAt]" is missing from JSON.');
        assert(json[r'createdAt'] != null, 'Required key "Appointment[createdAt]" has a null value in JSON.');
        return true;
      }());

      return Appointment(
        id: mapValueOfType<String>(json, r'id')!,
        patientId: mapValueOfType<String>(json, r'patientId')!,
        startsAt: mapDateTime(json, r'startsAt', r'')!,
        durationMinutes: mapValueOfType<int>(json, r'durationMinutes')!,
        recurrence: WeeklyRecurrence.fromJson(json[r'recurrence']),
        status: AppointmentStatus.fromJson(json[r'status'])!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
      );
    }
    return null;
  }

  static List<Appointment> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Appointment>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Appointment.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, Appointment> mapFromJson(dynamic json) {
    final map = <String, Appointment>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = Appointment.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of Appointment-objects as value to a dart map
  static Map<String, List<Appointment>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<Appointment>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = Appointment.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'patientId',
    'startsAt',
    'durationMinutes',
    'status',
    'createdAt',
  };
}

