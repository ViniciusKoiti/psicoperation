//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:psiops_contracts/api.dart';
import 'package:test/test.dart';


/// tests for AuthApi
void main() {
  // final instance = AuthApi();

  group('tests for AuthApi', () {
    // Consulta a sessão corrente
    //
    // Retorna a conta autenticada e a expiração do access token apresentado. Requer bearer token JWT válido.
    //
    //Future<GetCurrentSession200Response> getCurrentSession() async
    test('test getCurrentSession', () async {
      // TODO
    });

    // Autentica com e-mail e senha
    //
    // Valida as credenciais e retorna a conta autenticada com um novo par de tokens (access JWT + refresh). Endpoint público.
    //
    //Future<RegisterUser201Response> loginUser(LoginUserRequest loginUserRequest) async
    test('test loginUser', () async {
      // TODO
    });

    // Renova o par de tokens
    //
    // Troca um refresh token válido por um novo par de tokens. O refresh token apresentado é invalidado (rotação de uso único). Endpoint público — a credencial é o próprio refresh token no corpo.
    //
    //Future<RegisterUser201ResponseTokens> refreshToken(RefreshTokenRequest refreshTokenRequest) async
    test('test refreshToken', () async {
      // TODO
    });

    // Registra uma nova conta
    //
    // Cria a conta da psicóloga e já inicia a sessão, retornando a conta criada e o par de tokens (access JWT + refresh). Endpoint público.
    //
    //Future<RegisterUser201Response> registerUser(RegisterUserRequest registerUserRequest) async
    test('test registerUser', () async {
      // TODO
    });

  });
}
