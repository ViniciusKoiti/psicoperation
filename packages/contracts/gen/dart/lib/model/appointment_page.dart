//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AppointmentPage {
  /// Returns a new [AppointmentPage] instance.
  AppointmentPage({
    this.items = const [],
    required this.meta,
  });

  List<Appointment> items;

  PageMeta meta;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AppointmentPage &&
    _deepEquality.equals(other.items, items) &&
    other.meta == meta;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (items.hashCode) +
    (meta.hashCode);

  @override
  String toString() => 'AppointmentPage[items=$items, meta=$meta]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'items'] = this.items;
      json[r'meta'] = this.meta;
    return json;
  }

  /// Returns a new [AppointmentPage] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AppointmentPage? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'items'), 'Required key "AppointmentPage[items]" is missing from JSON.');
        assert(json[r'items'] != null, 'Required key "AppointmentPage[items]" has a null value in JSON.');
        assert(json.containsKey(r'meta'), 'Required key "AppointmentPage[meta]" is missing from JSON.');
        assert(json[r'meta'] != null, 'Required key "AppointmentPage[meta]" has a null value in JSON.');
        return true;
      }());

      return AppointmentPage(
        items: Appointment.listFromJson(json[r'items']),
        meta: PageMeta.fromJson(json[r'meta'])!,
      );
    }
    return null;
  }

  static List<AppointmentPage> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AppointmentPage>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AppointmentPage.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AppointmentPage> mapFromJson(dynamic json) {
    final map = <String, AppointmentPage>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AppointmentPage.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AppointmentPage-objects as value to a dart map
  static Map<String, List<AppointmentPage>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AppointmentPage>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AppointmentPage.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'items',
    'meta',
  };
}

