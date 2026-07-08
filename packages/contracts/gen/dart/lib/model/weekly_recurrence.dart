//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WeeklyRecurrence {
  /// Returns a new [WeeklyRecurrence] instance.
  WeeklyRecurrence({
    required this.weekday,
    this.interval = 1,
    this.until,
  });

  /// Dia da semana da recorrência.
  WeeklyRecurrenceWeekdayEnum weekday;

  /// Intervalo em semanas entre ocorrências (1 = toda semana, 2 = quinzenal).
  ///
  /// Minimum value: 1
  /// Maximum value: 8
  int interval;

  /// Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? until;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WeeklyRecurrence &&
    other.weekday == weekday &&
    other.interval == interval &&
    other.until == until;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (weekday.hashCode) +
    (interval.hashCode) +
    (until == null ? 0 : until!.hashCode);

  @override
  String toString() => 'WeeklyRecurrence[weekday=$weekday, interval=$interval, until=$until]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'weekday'] = this.weekday;
      json[r'interval'] = this.interval;
    if (this.until != null) {
      json[r'until'] = _dateFormatter.format(this.until!.toUtc());
    } else {
      json[r'until'] = null;
    }
    return json;
  }

  /// Returns a new [WeeklyRecurrence] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WeeklyRecurrence? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'weekday'), 'Required key "WeeklyRecurrence[weekday]" is missing from JSON.');
        assert(json[r'weekday'] != null, 'Required key "WeeklyRecurrence[weekday]" has a null value in JSON.');
        return true;
      }());

      return WeeklyRecurrence(
        weekday: WeeklyRecurrenceWeekdayEnum.fromJson(json[r'weekday'])!,
        interval: mapValueOfType<int>(json, r'interval') ?? 1,
        until: mapDateTime(json, r'until', r''),
      );
    }
    return null;
  }

  static List<WeeklyRecurrence> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WeeklyRecurrence>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WeeklyRecurrence.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WeeklyRecurrence> mapFromJson(dynamic json) {
    final map = <String, WeeklyRecurrence>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WeeklyRecurrence.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WeeklyRecurrence-objects as value to a dart map
  static Map<String, List<WeeklyRecurrence>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WeeklyRecurrence>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WeeklyRecurrence.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'weekday',
  };
}

/// Dia da semana da recorrência.
class WeeklyRecurrenceWeekdayEnum {
  /// Instantiate a new enum with the provided [value].
  const WeeklyRecurrenceWeekdayEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const segunda = WeeklyRecurrenceWeekdayEnum._(r'segunda');
  static const terca = WeeklyRecurrenceWeekdayEnum._(r'terca');
  static const quarta = WeeklyRecurrenceWeekdayEnum._(r'quarta');
  static const quinta = WeeklyRecurrenceWeekdayEnum._(r'quinta');
  static const sexta = WeeklyRecurrenceWeekdayEnum._(r'sexta');
  static const sabado = WeeklyRecurrenceWeekdayEnum._(r'sabado');
  static const domingo = WeeklyRecurrenceWeekdayEnum._(r'domingo');

  /// List of all possible values in this [enum][WeeklyRecurrenceWeekdayEnum].
  static const values = <WeeklyRecurrenceWeekdayEnum>[
    segunda,
    terca,
    quarta,
    quinta,
    sexta,
    sabado,
    domingo,
  ];

  static WeeklyRecurrenceWeekdayEnum? fromJson(dynamic value) => WeeklyRecurrenceWeekdayEnumTypeTransformer().decode(value);

  static List<WeeklyRecurrenceWeekdayEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WeeklyRecurrenceWeekdayEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WeeklyRecurrenceWeekdayEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [WeeklyRecurrenceWeekdayEnum] to String,
/// and [decode] dynamic data back to [WeeklyRecurrenceWeekdayEnum].
class WeeklyRecurrenceWeekdayEnumTypeTransformer {
  factory WeeklyRecurrenceWeekdayEnumTypeTransformer() => _instance ??= const WeeklyRecurrenceWeekdayEnumTypeTransformer._();

  const WeeklyRecurrenceWeekdayEnumTypeTransformer._();

  String encode(WeeklyRecurrenceWeekdayEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a WeeklyRecurrenceWeekdayEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  WeeklyRecurrenceWeekdayEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'segunda': return WeeklyRecurrenceWeekdayEnum.segunda;
        case r'terca': return WeeklyRecurrenceWeekdayEnum.terca;
        case r'quarta': return WeeklyRecurrenceWeekdayEnum.quarta;
        case r'quinta': return WeeklyRecurrenceWeekdayEnum.quinta;
        case r'sexta': return WeeklyRecurrenceWeekdayEnum.sexta;
        case r'sabado': return WeeklyRecurrenceWeekdayEnum.sabado;
        case r'domingo': return WeeklyRecurrenceWeekdayEnum.domingo;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [WeeklyRecurrenceWeekdayEnumTypeTransformer] instance.
  static WeeklyRecurrenceWeekdayEnumTypeTransformer? _instance;
}


