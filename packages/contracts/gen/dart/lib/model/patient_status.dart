//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Situação cadastral do paciente na carteira da psicóloga. `ativo` recebe cobranças; `inativo` foi arquivado e não gera novas mensalidades.
class PatientStatus {
  /// Instantiate a new enum with the provided [value].
  const PatientStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const ativo = PatientStatus._(r'ativo');
  static const inativo = PatientStatus._(r'inativo');

  /// List of all possible values in this [enum][PatientStatus].
  static const values = <PatientStatus>[
    ativo,
    inativo,
  ];

  static PatientStatus? fromJson(dynamic value) => PatientStatusTypeTransformer().decode(value);

  static List<PatientStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PatientStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PatientStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PatientStatus] to String,
/// and [decode] dynamic data back to [PatientStatus].
class PatientStatusTypeTransformer {
  factory PatientStatusTypeTransformer() => _instance ??= const PatientStatusTypeTransformer._();

  const PatientStatusTypeTransformer._();

  String encode(PatientStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a PatientStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PatientStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'ativo': return PatientStatus.ativo;
        case r'inativo': return PatientStatus.inativo;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PatientStatusTypeTransformer] instance.
  static PatientStatusTypeTransformer? _instance;
}

