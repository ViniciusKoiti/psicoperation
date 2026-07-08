//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AppointmentUpdateRequest {
  /// Returns a new [AppointmentUpdateRequest] instance.
  AppointmentUpdateRequest({
    this.startsAt,
    this.durationMinutes,
    this.recurrence,
    this.status,
  });

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? startsAt;

  /// Minimum value: 1
  /// Maximum value: 480
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? durationMinutes;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  WeeklyRecurrence? recurrence;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AppointmentStatus? status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AppointmentUpdateRequest &&
    other.startsAt == startsAt &&
    other.durationMinutes == durationMinutes &&
    other.recurrence == recurrence &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (startsAt == null ? 0 : startsAt!.hashCode) +
    (durationMinutes == null ? 0 : durationMinutes!.hashCode) +
    (recurrence == null ? 0 : recurrence!.hashCode) +
    (status == null ? 0 : status!.hashCode);

  @override
  String toString() => 'AppointmentUpdateRequest[startsAt=$startsAt, durationMinutes=$durationMinutes, recurrence=$recurrence, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.startsAt != null) {
      json[r'startsAt'] = this.startsAt!.toUtc().toIso8601String();
    } else {
      json[r'startsAt'] = null;
    }
    if (this.durationMinutes != null) {
      json[r'durationMinutes'] = this.durationMinutes;
    } else {
      json[r'durationMinutes'] = null;
    }
    if (this.recurrence != null) {
      json[r'recurrence'] = this.recurrence;
    } else {
      json[r'recurrence'] = null;
    }
    if (this.status != null) {
      json[r'status'] = this.status;
    } else {
      json[r'status'] = null;
    }
    return json;
  }

  /// Returns a new [AppointmentUpdateRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AppointmentUpdateRequest? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        return true;
      }());

      return AppointmentUpdateRequest(
        startsAt: mapDateTime(json, r'startsAt', r''),
        durationMinutes: mapValueOfType<int>(json, r'durationMinutes'),
        recurrence: WeeklyRecurrence.fromJson(json[r'recurrence']),
        status: AppointmentStatus.fromJson(json[r'status']),
      );
    }
    return null;
  }

  static List<AppointmentUpdateRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AppointmentUpdateRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AppointmentUpdateRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AppointmentUpdateRequest> mapFromJson(dynamic json) {
    final map = <String, AppointmentUpdateRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AppointmentUpdateRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AppointmentUpdateRequest-objects as value to a dart map
  static Map<String, List<AppointmentUpdateRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AppointmentUpdateRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AppointmentUpdateRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

