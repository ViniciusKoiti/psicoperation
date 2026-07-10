import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../data/patients_adapter.dart';
import 'patient_validators.dart';

/// Formulário de cadastro (`PatientFormScreen.create`) ou edição
/// (`PatientFormScreen.edit`) de paciente.
///
/// Validação inline consistente com os contratos (ver `patient_validators.
/// dart`, derivado das restrições de `packages/contracts/openapi/
/// components/patient/schemas.yaml`), mensagens em pt-BR. Ao salvar com
/// sucesso, faz `pop(true)` — quem empurrou esta rota decide se recarrega a
/// lista/detalhe (mesmo padrão de retorno usado pelos modais da agenda,
/// PSI-041).
class PatientFormScreen extends StatefulWidget {
  const PatientFormScreen.create({super.key, required this.adapter}) : editing = null;

  const PatientFormScreen.edit({
    super.key,
    required this.adapter,
    required Patient patient,
  }) : editing = patient;

  final PatientsAdapter adapter;

  /// Paciente sendo editado, ou `null` num cadastro novo.
  final Patient? editing;

  bool get isEditing => editing != null;

  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _whatsappController;
  late final TextEditingController _emailController;
  late final TextEditingController _monthlyFeeController;
  late final TextEditingController _notesController;
  late int _billingDay;

  bool _submitting = false;
  String? _submitError;

  @override
  void initState() {
    super.initState();
    final editing = widget.editing;
    _nameController = TextEditingController(text: editing?.name ?? '');
    _whatsappController = TextEditingController(
      text: editing?.whatsapp == null ? '' : whatsappFromE164ForInput(editing!.whatsapp!),
    );
    _emailController = TextEditingController(text: editing?.email ?? '');
    _monthlyFeeController = TextEditingController(
      text: editing == null ? '' : centsToBRLInput(editing.monthlyFee),
    );
    _notesController = TextEditingController(text: editing?.notes ?? '');
    _billingDay = editing?.billingDay ?? 5;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _whatsappController.dispose();
    _emailController.dispose();
    _monthlyFeeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    setState(() {
      _submitting = true;
      _submitError = null;
    });

    final name = _nameController.text.trim();
    final whatsapp = whatsappToE164(_whatsappController.text);
    final emailText = _emailController.text.trim();
    final email = emailText.isEmpty ? null : emailText;
    final monthlyFee = parseCentsFromBRLInput(_monthlyFeeController.text)!;
    final notesText = _notesController.text.trim();
    final notes = notesText.isEmpty ? null : notesText;

    try {
      if (widget.isEditing) {
        await widget.adapter.updatePatient(
          widget.editing!.id,
          PatientUpdateRequest(
            name: name,
            whatsapp: whatsapp,
            email: email,
            monthlyFee: monthlyFee,
            billingDay: _billingDay,
            notes: notes,
          ),
        );
      } else {
        await widget.adapter.createPatient(
          PatientCreateRequest(
            name: name,
            whatsapp: whatsapp,
            email: email,
            monthlyFee: monthlyFee,
            billingDay: _billingDay,
            notes: notes,
          ),
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on PatientsAdapterException catch (error) {
      if (!mounted) return;
      setState(() => _submitError = error.message);
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _submitError = 'Não foi possível salvar o paciente. Tente novamente.',
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEditing ? 'Editar paciente' : 'Novo paciente'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_submitError != null) ...[
                  Container(
                    key: const Key('patient-form-error'),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _submitError!,
                      style: TextStyle(color: colors.onErrorContainer),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  key: const Key('patient-form-name-field'),
                  controller: _nameController,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Nome do paciente'),
                  validator: validatePatientName,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('patient-form-whatsapp-field'),
                  controller: _whatsappController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  inputFormatters: [_WhatsappInputFormatter()],
                  decoration: const InputDecoration(
                    labelText: 'WhatsApp (opcional)',
                    hintText: '(11) 99000-0000',
                  ),
                  validator: validatePatientWhatsapp,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('patient-form-email-field'),
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'E-mail (opcional)',
                    hintText: 'paciente@exemplo.com.br',
                  ),
                  validator: validatePatientEmail,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('patient-form-monthly-fee-field'),
                  controller: _monthlyFeeController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Valor da mensalidade (R\$)',
                    hintText: '150,00',
                  ),
                  validator: validatePatientMonthlyFee,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<int>(
                  key: const Key('patient-form-billing-day-field'),
                  value: _billingDay,
                  decoration: const InputDecoration(labelText: 'Dia de vencimento'),
                  items: [
                    for (var day = 1; day <= 28; day++)
                      DropdownMenuItem(value: day, child: Text('Dia $day')),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _billingDay = value);
                  },
                  validator: validatePatientBillingDay,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('patient-form-notes-field'),
                  controller: _notesController,
                  maxLines: 3,
                  maxLength: 2000,
                  decoration: const InputDecoration(
                    labelText: 'Anotações administrativas (opcional)',
                    helperText:
                        'Ex.: preferências de contato, combinados de pagamento. '
                        'Nunca registre informações clínicas aqui.',
                    helperMaxLines: 2,
                  ),
                  validator: validatePatientNotes,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  key: const Key('patient-form-submit-button'),
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(widget.isEditing ? 'Salvar alterações' : 'Cadastrar paciente'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Formata o WhatsApp digitado como `(XX) XXXXX-XXXX` a cada mudança —
/// máscara apenas de apresentação (ver `WhatsAppBR` no contrato): o valor
/// enviado à API é sempre convertido para E.164 via [whatsappToE164].
class _WhatsappInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    final limited = digits.length > 11 ? digits.substring(0, 11) : digits;
    final buffer = StringBuffer();
    for (var i = 0; i < limited.length; i++) {
      if (i == 0) buffer.write('(');
      buffer.write(limited[i]);
      if (i == 1) buffer.write(') ');
      if (i == 6) buffer.write('-');
    }
    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
