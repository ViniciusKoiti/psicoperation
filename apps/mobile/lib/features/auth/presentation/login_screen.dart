import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../data/auth_adapter.dart';
import '../state/session_controller.dart';
import 'auth_validators.dart';

/// Tela de login (pt-BR).
///
/// Não navega explicitamente em caso de sucesso: assim que
/// [SessionController.login] resolve, o status muda para `authenticated` e o
/// redirect do `go_router` (que observa o controller via `refreshListenable`)
/// leva a usuária à rota de destino original (ou à home). Isso mantém a
/// navegação centralizada em um único lugar (`app/router.dart`).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.session});

  final SessionController session;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _submitting = false;
  String? _authError;
  String? _infoMessage;

  @override
  void initState() {
    super.initState();
    // Mensagem de uma única exibição, deixada pela SessionController após um
    // logout forçado (falha definitiva de refresh).
    _infoMessage = widget.session.consumePendingMessage();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    setState(() {
      _submitting = true;
      _authError = null;
      _infoMessage = null;
    });

    try {
      await widget.session.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } on AuthAdapterException catch (error) {
      if (!mounted) return;
      setState(() => _authError = error.message);
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _authError = 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('PsiOps', style: textTheme.displaySmall),
                    const SizedBox(height: 8),
                    Text(
                      'Entre para acompanhar suas mensalidades.',
                      style: textTheme.bodyLarge?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (_infoMessage != null) ...[
                      _AuthBanner(
                        key: const Key('login-info-message'),
                        message: _infoMessage!,
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (_authError != null) ...[
                      _AuthBanner(
                        key: const Key('login-error-message'),
                        message: _authError!,
                        isError: true,
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      key: const Key('login-email-field'),
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(
                        labelText: 'E-mail',
                        hintText: 'voce@exemplo.com.br',
                      ),
                      validator: validateEmail,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      key: const Key('login-password-field'),
                      controller: _passwordController,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      decoration: const InputDecoration(labelText: 'Senha'),
                      validator: validatePassword,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      key: const Key('login-submit-button'),
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : const Text('Entrar'),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      key: const Key('login-go-register-button'),
                      onPressed: _submitting
                          ? null
                          : () => context.goNamed(Routes.register),
                      child: const Text('Ainda não tem conta? Cadastre-se'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthBanner extends StatelessWidget {
  const _AuthBanner({super.key, required this.message, this.isError = false});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = isError ? colors.errorContainer : colors.tertiaryContainer;
    final foreground = isError ? colors.onErrorContainer : colors.onTertiaryContainer;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(message, style: TextStyle(color: foreground)),
    );
  }
}
