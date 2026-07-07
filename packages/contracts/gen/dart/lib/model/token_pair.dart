//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TokenPair {
  /// Returns a new [TokenPair] instance.
  TokenPair({
    required this.tokenType,
    required this.accessToken,
    required this.expiresIn,
    required this.refreshToken,
  });

  /// Tipo do token, sempre `Bearer`.
  TokenPairTokenTypeEnum tokenType;

  /// JWT de acesso, de curta duração.
  String accessToken;

  /// Segundos até a expiração do access token, contados da emissão.
  ///
  /// Minimum value: 1
  int expiresIn;

  /// Refresh token opaco para obter um novo par via /auth/refresh.
  String refreshToken;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TokenPair &&
    other.tokenType == tokenType &&
    other.accessToken == accessToken &&
    other.expiresIn == expiresIn &&
    other.refreshToken == refreshToken;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (tokenType.hashCode) +
    (accessToken.hashCode) +
    (expiresIn.hashCode) +
    (refreshToken.hashCode);

  @override
  String toString() => 'TokenPair[tokenType=$tokenType, accessToken=$accessToken, expiresIn=$expiresIn, refreshToken=$refreshToken]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'tokenType'] = this.tokenType;
      json[r'accessToken'] = this.accessToken;
      json[r'expiresIn'] = this.expiresIn;
      json[r'refreshToken'] = this.refreshToken;
    return json;
  }

  /// Returns a new [TokenPair] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TokenPair? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'tokenType'), 'Required key "TokenPair[tokenType]" is missing from JSON.');
        assert(json[r'tokenType'] != null, 'Required key "TokenPair[tokenType]" has a null value in JSON.');
        assert(json.containsKey(r'accessToken'), 'Required key "TokenPair[accessToken]" is missing from JSON.');
        assert(json[r'accessToken'] != null, 'Required key "TokenPair[accessToken]" has a null value in JSON.');
        assert(json.containsKey(r'expiresIn'), 'Required key "TokenPair[expiresIn]" is missing from JSON.');
        assert(json[r'expiresIn'] != null, 'Required key "TokenPair[expiresIn]" has a null value in JSON.');
        assert(json.containsKey(r'refreshToken'), 'Required key "TokenPair[refreshToken]" is missing from JSON.');
        assert(json[r'refreshToken'] != null, 'Required key "TokenPair[refreshToken]" has a null value in JSON.');
        return true;
      }());

      return TokenPair(
        tokenType: TokenPairTokenTypeEnum.fromJson(json[r'tokenType'])!,
        accessToken: mapValueOfType<String>(json, r'accessToken')!,
        expiresIn: mapValueOfType<int>(json, r'expiresIn')!,
        refreshToken: mapValueOfType<String>(json, r'refreshToken')!,
      );
    }
    return null;
  }

  static List<TokenPair> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TokenPair>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TokenPair.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TokenPair> mapFromJson(dynamic json) {
    final map = <String, TokenPair>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TokenPair.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TokenPair-objects as value to a dart map
  static Map<String, List<TokenPair>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TokenPair>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TokenPair.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'tokenType',
    'accessToken',
    'expiresIn',
    'refreshToken',
  };
}

/// Tipo do token, sempre `Bearer`.
class TokenPairTokenTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const TokenPairTokenTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const bearer = TokenPairTokenTypeEnum._(r'Bearer');

  /// List of all possible values in this [enum][TokenPairTokenTypeEnum].
  static const values = <TokenPairTokenTypeEnum>[
    bearer,
  ];

  static TokenPairTokenTypeEnum? fromJson(dynamic value) => TokenPairTokenTypeEnumTypeTransformer().decode(value);

  static List<TokenPairTokenTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TokenPairTokenTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TokenPairTokenTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TokenPairTokenTypeEnum] to String,
/// and [decode] dynamic data back to [TokenPairTokenTypeEnum].
class TokenPairTokenTypeEnumTypeTransformer {
  factory TokenPairTokenTypeEnumTypeTransformer() => _instance ??= const TokenPairTokenTypeEnumTypeTransformer._();

  const TokenPairTokenTypeEnumTypeTransformer._();

  String encode(TokenPairTokenTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a TokenPairTokenTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TokenPairTokenTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'Bearer': return TokenPairTokenTypeEnum.bearer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TokenPairTokenTypeEnumTypeTransformer] instance.
  static TokenPairTokenTypeEnumTypeTransformer? _instance;
}


