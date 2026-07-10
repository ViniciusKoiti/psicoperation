import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/features/patients/presentation/patient_validators.dart';

void main() {
  group('validatePatientName', () {
    test('rejeita nome vazio', () {
      expect(validatePatientName(''), isNotNull);
      expect(validatePatientName(null), isNotNull);
      expect(validatePatientName('   '), isNotNull);
    });

    test('rejeita nome maior que 120 caracteres', () {
      expect(validatePatientName('A' * 121), isNotNull);
    });

    test('aceita nome válido', () {
      expect(validatePatientName('Marina Alves'), isNull);
    });
  });

  group('validatePatientWhatsapp', () {
    test('é opcional: aceita vazio', () {
      expect(validatePatientWhatsapp(''), isNull);
      expect(validatePatientWhatsapp(null), isNull);
    });

    test('aceita número mascarado válido', () {
      expect(validatePatientWhatsapp('(11) 99000-0000'), isNull);
    });

    test('rejeita quantidade errada de dígitos', () {
      expect(validatePatientWhatsapp('(11) 9000-000'), isNotNull);
    });

    test('rejeita DDD começando em zero', () {
      expect(validatePatientWhatsapp('(01) 99000-0000'), isNotNull);
    });

    test('rejeita celular que não comece com 9 após o DDD', () {
      expect(validatePatientWhatsapp('(11) 89000-0000'), isNotNull);
    });
  });

  group('validatePatientEmail', () {
    test('é opcional: aceita vazio', () {
      expect(validatePatientEmail(''), isNull);
      expect(validatePatientEmail(null), isNull);
    });

    test('aceita e-mail válido', () {
      expect(validatePatientEmail('paciente@exemplo.com.br'), isNull);
    });

    test('rejeita e-mail sem formato válido', () {
      expect(validatePatientEmail('não-é-email'), isNotNull);
    });
  });

  group('validatePatientMonthlyFee', () {
    test('rejeita vazio', () {
      expect(validatePatientMonthlyFee(''), isNotNull);
    });

    test('rejeita valor não numérico', () {
      expect(validatePatientMonthlyFee('abc'), isNotNull);
    });

    test('rejeita zero', () {
      expect(validatePatientMonthlyFee('0,00'), isNotNull);
    });

    test('aceita valor com vírgula decimal', () {
      expect(validatePatientMonthlyFee('150,00'), isNull);
    });

    test('aceita valor inteiro sem centavos', () {
      expect(validatePatientMonthlyFee('150'), isNull);
    });
  });

  group('validatePatientBillingDay', () {
    test('rejeita nulo', () {
      expect(validatePatientBillingDay(null), isNotNull);
    });

    test('rejeita fora do intervalo 1-28', () {
      expect(validatePatientBillingDay(0), isNotNull);
      expect(validatePatientBillingDay(29), isNotNull);
    });

    test('aceita dentro do intervalo', () {
      expect(validatePatientBillingDay(1), isNull);
      expect(validatePatientBillingDay(28), isNull);
    });
  });

  group('validatePatientNotes', () {
    test('é opcional: aceita vazio', () {
      expect(validatePatientNotes(''), isNull);
      expect(validatePatientNotes(null), isNull);
    });

    test('rejeita mais de 2000 caracteres', () {
      expect(validatePatientNotes('A' * 2001), isNotNull);
    });
  });

  group('conversão WhatsApp mascarado <-> E.164', () {
    test('whatsappToE164 converte mascarado para E.164', () {
      expect(whatsappToE164('(11) 99000-0000'), '+5511990000000');
    });

    test('whatsappToE164 retorna null para vazio', () {
      expect(whatsappToE164(''), isNull);
      expect(whatsappToE164(null), isNull);
    });

    test('whatsappFromE164ForInput extrai DDD+número sem o +55', () {
      expect(whatsappFromE164ForInput('+5511990000000'), '11990000000');
    });

    test('formatWhatsappForDisplay formata E.164 como máscara pt-BR', () {
      expect(formatWhatsappForDisplay('+5511990000000'), '(11) 99000-0000');
    });
  });
}
