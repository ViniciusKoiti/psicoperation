//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class Payment {
  /// Returns a new [Payment] instance.
  Payment({
    required this.paidAmount,
    required this.paidAt,
    required this.method,
    this.note,
  });

  /// Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
  int paidAmount;

  /// Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
  DateTime paidAt;

  PaymentMethod method;

  /// Observação administrativa do pagamento (opcional).
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? note;

  @override
  bool operator ==(Object other) => identical(this, other) || other is Payment &&
    other.paidAmount == paidAmount &&
    other.paidAt == paidAt &&
    other.method == method &&
    other.note == note;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (paidAmount.hashCode) +
    (paidAt.hashCode) +
    (method.hashCode) +
    (note == null ? 0 : note!.hashCode);

  @override
  String toString() => 'Payment[paidAmount=$paidAmount, paidAt=$paidAt, method=$method, note=$note]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'paidAmount'] = this.paidAmount;
      json[r'paidAt'] = this.paidAt.toUtc().toIso8601String();
      json[r'method'] = this.method;
    if (this.note != null) {
      json[r'note'] = this.note;
    } else {
      json[r'note'] = null;
    }
    return json;
  }

  /// Returns a new [Payment] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static Payment? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'paidAmount'), 'Required key "Payment[paidAmount]" is missing from JSON.');
        assert(json[r'paidAmount'] != null, 'Required key "Payment[paidAmount]" has a null value in JSON.');
        assert(json.containsKey(r'paidAt'), 'Required key "Payment[paidAt]" is missing from JSON.');
        assert(json[r'paidAt'] != null, 'Required key "Payment[paidAt]" has a null value in JSON.');
        assert(json.containsKey(r'method'), 'Required key "Payment[method]" is missing from JSON.');
        assert(json[r'method'] != null, 'Required key "Payment[method]" has a null value in JSON.');
        return true;
      }());

      return Payment(
        paidAmount: mapValueOfType<int>(json, r'paidAmount')!,
        paidAt: mapDateTime(json, r'paidAt', r'')!,
        method: PaymentMethod.fromJson(json[r'method'])!,
        note: mapValueOfType<String>(json, r'note'),
      );
    }
    return null;
  }

  static List<Payment> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Payment>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Payment.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, Payment> mapFromJson(dynamic json) {
    final map = <String, Payment>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = Payment.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of Payment-objects as value to a dart map
  static Map<String, List<Payment>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<Payment>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = Payment.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'paidAmount',
    'paidAt',
    'method',
  };
}

