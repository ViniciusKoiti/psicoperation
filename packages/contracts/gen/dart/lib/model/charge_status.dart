//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Situação de pagamento da cobrança. `em_dia` = paga ou dentro do prazo; `pendente` = aguardando pagamento, ainda não vencida; `atrasada` = vencida e não paga.
class ChargeStatus {
  /// Instantiate a new enum with the provided [value].
  const ChargeStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const emDia = ChargeStatus._(r'em_dia');
  static const pendente = ChargeStatus._(r'pendente');
  static const atrasada = ChargeStatus._(r'atrasada');

  /// List of all possible values in this [enum][ChargeStatus].
  static const values = <ChargeStatus>[
    emDia,
    pendente,
    atrasada,
  ];

  static ChargeStatus? fromJson(dynamic value) => ChargeStatusTypeTransformer().decode(value);

  static List<ChargeStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ChargeStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ChargeStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ChargeStatus] to String,
/// and [decode] dynamic data back to [ChargeStatus].
class ChargeStatusTypeTransformer {
  factory ChargeStatusTypeTransformer() => _instance ??= const ChargeStatusTypeTransformer._();

  const ChargeStatusTypeTransformer._();

  String encode(ChargeStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a ChargeStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ChargeStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'em_dia': return ChargeStatus.emDia;
        case r'pendente': return ChargeStatus.pendente;
        case r'atrasada': return ChargeStatus.atrasada;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ChargeStatusTypeTransformer] instance.
  static ChargeStatusTypeTransformer? _instance;
}

