//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Situação do lembrete no ciclo de envio.
class ReminderStatus {
  /// Instantiate a new enum with the provided [value].
  const ReminderStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const agendado = ReminderStatus._(r'agendado');
  static const enviado = ReminderStatus._(r'enviado');
  static const falhou = ReminderStatus._(r'falhou');
  static const cancelado = ReminderStatus._(r'cancelado');

  /// List of all possible values in this [enum][ReminderStatus].
  static const values = <ReminderStatus>[
    agendado,
    enviado,
    falhou,
    cancelado,
  ];

  static ReminderStatus? fromJson(dynamic value) => ReminderStatusTypeTransformer().decode(value);

  static List<ReminderStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReminderStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReminderStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ReminderStatus] to String,
/// and [decode] dynamic data back to [ReminderStatus].
class ReminderStatusTypeTransformer {
  factory ReminderStatusTypeTransformer() => _instance ??= const ReminderStatusTypeTransformer._();

  const ReminderStatusTypeTransformer._();

  String encode(ReminderStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a ReminderStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ReminderStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'agendado': return ReminderStatus.agendado;
        case r'enviado': return ReminderStatus.enviado;
        case r'falhou': return ReminderStatus.falhou;
        case r'cancelado': return ReminderStatus.cancelado;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ReminderStatusTypeTransformer] instance.
  static ReminderStatusTypeTransformer? _instance;
}

