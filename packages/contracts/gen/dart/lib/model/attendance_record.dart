//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AttendanceRecord {
  /// Returns a new [AttendanceRecord] instance.
  AttendanceRecord({
    required this.attendance,
    this.administrativeNotes,
    this.recordedAt,
  });

  AttendanceStatus attendance;

  /// Anotação ADMINISTRATIVA (ex.: \"remarcou por viagem\", \"faltou sem aviso\"). Nunca conteúdo clínico.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? administrativeNotes;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? recordedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AttendanceRecord &&
    other.attendance == attendance &&
    other.administrativeNotes == administrativeNotes &&
    other.recordedAt == recordedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (attendance.hashCode) +
    (administrativeNotes == null ? 0 : administrativeNotes!.hashCode) +
    (recordedAt == null ? 0 : recordedAt!.hashCode);

  @override
  String toString() => 'AttendanceRecord[attendance=$attendance, administrativeNotes=$administrativeNotes, recordedAt=$recordedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'attendance'] = this.attendance;
    if (this.administrativeNotes != null) {
      json[r'administrativeNotes'] = this.administrativeNotes;
    } else {
      json[r'administrativeNotes'] = null;
    }
    if (this.recordedAt != null) {
      json[r'recordedAt'] = this.recordedAt!.toUtc().toIso8601String();
    } else {
      json[r'recordedAt'] = null;
    }
    return json;
  }

  /// Returns a new [AttendanceRecord] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AttendanceRecord? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'attendance'), 'Required key "AttendanceRecord[attendance]" is missing from JSON.');
        assert(json[r'attendance'] != null, 'Required key "AttendanceRecord[attendance]" has a null value in JSON.');
        return true;
      }());

      return AttendanceRecord(
        attendance: AttendanceStatus.fromJson(json[r'attendance'])!,
        administrativeNotes: mapValueOfType<String>(json, r'administrativeNotes'),
        recordedAt: mapDateTime(json, r'recordedAt', r''),
      );
    }
    return null;
  }

  static List<AttendanceRecord> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AttendanceRecord>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AttendanceRecord.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AttendanceRecord> mapFromJson(dynamic json) {
    final map = <String, AttendanceRecord>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AttendanceRecord.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AttendanceRecord-objects as value to a dart map
  static Map<String, List<AttendanceRecord>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AttendanceRecord>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AttendanceRecord.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'attendance',
  };
}

