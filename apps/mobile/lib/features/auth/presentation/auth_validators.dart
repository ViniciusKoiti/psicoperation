/// Validação inline (pt-BR) compartilhada pelas telas de login e registro.
///
/// A regra de senha (mínimo 8 caracteres) espelha a restrição do backend
/// documentada em `RegisterRequest.password`
/// (`packages/contracts/openapi/components/auth/schemas.yaml`): mínimo de 8
/// caracteres, máximo de 72 bytes (limite do BCrypt).
library;

final RegExp _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String? validateEmail(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return 'Informe seu e-mail.';
  if (!_emailPattern.hasMatch(trimmed)) return 'Informe um e-mail válido.';
  return null;
}

String? validatePassword(String? value) {
  final password = value ?? '';
  if (password.isEmpty) return 'Informe sua senha.';
  if (password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  return null;
}

String? validateName(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return 'Informe seu nome completo.';
  if (!trimmed.contains(' ')) return 'Informe nome e sobrenome.';
  return null;
}
