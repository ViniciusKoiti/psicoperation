//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RegisterUser201ResponseTokens {
  /// Returns a new [RegisterUser201ResponseTokens] instance.
  RegisterUser201ResponseTokens({
    required this.tokenType,
    required this.accessToken,
    required this.expiresIn,
    required this.refreshToken,
  });

  /// Tipo do token, sempre `Bearer`.
  RegisterUser201ResponseTokensTokenTypeEnum tokenType;

  /// JWT de acesso, de curta duração.
  String accessToken;

  /// Segundos até a expiração do access token, contados da emissão.
  ///
  /// Minimum value: 1
  int expiresIn;

  /// Refresh token opaco para obter um novo par via /auth/refresh.
  String refreshToken;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RegisterUser201ResponseTokens &&
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
  String toString() => 'RegisterUser201ResponseTokens[tokenType=$tokenType, accessToken=$accessToken, expiresIn=$expiresIn, refreshToken=$refreshToken]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'tokenType'] = this.tokenType;
      json[r'accessToken'] = this.accessToken;
      json[r'expiresIn'] = this.expiresIn;
      json[r'refreshToken'] = this.refreshToken;
    return json;
  }

  /// Returns a new [RegisterUser201ResponseTokens] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RegisterUser201ResponseTokens? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'tokenType'), 'Required key "RegisterUser201ResponseTokens[tokenType]" is missing from JSON.');
        assert(json[r'tokenType'] != null, 'Required key "RegisterUser201ResponseTokens[tokenType]" has a null value in JSON.');
        assert(json.containsKey(r'accessToken'), 'Required key "RegisterUser201ResponseTokens[accessToken]" is missing from JSON.');
        assert(json[r'accessToken'] != null, 'Required key "RegisterUser201ResponseTokens[accessToken]" has a null value in JSON.');
        assert(json.containsKey(r'expiresIn'), 'Required key "RegisterUser201ResponseTokens[expiresIn]" is missing from JSON.');
        assert(json[r'expiresIn'] != null, 'Required key "RegisterUser201ResponseTokens[expiresIn]" has a null value in JSON.');
        assert(json.containsKey(r'refreshToken'), 'Required key "RegisterUser201ResponseTokens[refreshToken]" is missing from JSON.');
        assert(json[r'refreshToken'] != null, 'Required key "RegisterUser201ResponseTokens[refreshToken]" has a null value in JSON.');
        return true;
      }());

      return RegisterUser201ResponseTokens(
        tokenType: RegisterUser201ResponseTokensTokenTypeEnum.fromJson(json[r'tokenType'])!,
        accessToken: mapValueOfType<String>(json, r'accessToken')!,
        expiresIn: mapValueOfType<int>(json, r'expiresIn')!,
        refreshToken: mapValueOfType<String>(json, r'refreshToken')!,
      );
    }
    return null;
  }

  static List<RegisterUser201ResponseTokens> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RegisterUser201ResponseTokens>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RegisterUser201ResponseTokens.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RegisterUser201ResponseTokens> mapFromJson(dynamic json) {
    final map = <String, RegisterUser201ResponseTokens>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RegisterUser201ResponseTokens.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RegisterUser201ResponseTokens-objects as value to a dart map
  static Map<String, List<RegisterUser201ResponseTokens>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RegisterUser201ResponseTokens>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RegisterUser201ResponseTokens.listFromJson(entry.value, growable: growable,);
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
class RegisterUser201ResponseTokensTokenTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const RegisterUser201ResponseTokensTokenTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const bearer = RegisterUser201ResponseTokensTokenTypeEnum._(r'Bearer');

  /// List of all possible values in this [enum][RegisterUser201ResponseTokensTokenTypeEnum].
  static const values = <RegisterUser201ResponseTokensTokenTypeEnum>[
    bearer,
  ];

  static RegisterUser201ResponseTokensTokenTypeEnum? fromJson(dynamic value) => RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer().decode(value);

  static List<RegisterUser201ResponseTokensTokenTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RegisterUser201ResponseTokensTokenTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RegisterUser201ResponseTokensTokenTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RegisterUser201ResponseTokensTokenTypeEnum] to String,
/// and [decode] dynamic data back to [RegisterUser201ResponseTokensTokenTypeEnum].
class RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer {
  factory RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer() => _instance ??= const RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer._();

  const RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer._();

  String encode(RegisterUser201ResponseTokensTokenTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a RegisterUser201ResponseTokensTokenTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RegisterUser201ResponseTokensTokenTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'Bearer': return RegisterUser201ResponseTokensTokenTypeEnum.bearer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer] instance.
  static RegisterUser201ResponseTokensTokenTypeEnumTypeTransformer? _instance;
}


