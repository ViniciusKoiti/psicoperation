//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Presença administrativa do paciente na consulta.
class AttendanceStatus {
  /// Instantiate a new enum with the provided [value].
  const AttendanceStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const compareceu = AttendanceStatus._(r'compareceu');
  static const faltou = AttendanceStatus._(r'faltou');
  static const remarcada = AttendanceStatus._(r'remarcada');

  /// List of all possible values in this [enum][AttendanceStatus].
  static const values = <AttendanceStatus>[
    compareceu,
    faltou,
    remarcada,
  ];

  static AttendanceStatus? fromJson(dynamic value) => AttendanceStatusTypeTransformer().decode(value);

  static List<AttendanceStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AttendanceStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AttendanceStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AttendanceStatus] to String,
/// and [decode] dynamic data back to [AttendanceStatus].
class AttendanceStatusTypeTransformer {
  factory AttendanceStatusTypeTransformer() => _instance ??= const AttendanceStatusTypeTransformer._();

  const AttendanceStatusTypeTransformer._();

  String encode(AttendanceStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a AttendanceStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AttendanceStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'compareceu': return AttendanceStatus.compareceu;
        case r'faltou': return AttendanceStatus.faltou;
        case r'remarcada': return AttendanceStatus.remarcada;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AttendanceStatusTypeTransformer] instance.
  static AttendanceStatusTypeTransformer? _instance;
}

