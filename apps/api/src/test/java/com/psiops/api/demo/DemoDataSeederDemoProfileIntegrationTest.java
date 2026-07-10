package com.psiops.api.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.auth.application.AuthService;
import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.billing.persistence.ChargeEntity;
import com.psiops.api.billing.persistence.ChargeRepository;
import com.psiops.api.billing.persistence.ChargeStatus;
import com.psiops.api.lead.persistence.LeadRepository;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.support.ContainersConfig;
import com.psiops.api.task.persistence.TaskEntity;
import com.psiops.api.task.persistence.TaskRepository;
import com.psiops.contracts.model.LoginRequest;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Cobertura ponta a ponta (Testcontainers, PostgreSQL real) do seed de
 * demonstração (PSI-046) com o perfil {@code demo} ativo: {@link
 * DemoDataSeeder} roda automaticamente na subida do contexto (é um {@code
 * ApplicationRunner} registrado via {@code @Profile("demo")}), então cada
 * teste aqui apenas verifica o estado persistido — e, no teste de
 * idempotência, invoca o seeder uma segunda vez manualmente contra o MESMO
 * banco, simulando a API reiniciada no perfil demo.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("demo")
@Import(ContainersConfig.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DemoDataSeederDemoProfileIntegrationTest {

  private static final List<String> FORBIDDEN_CLINICAL_KEYWORDS =
      List.of(
          "diagnóstico", "diagnostico", "cid-10", "queixa", "sintoma", "transtorno", "ansiedade",
          "depress", "tdah", "prontuário", "prontuario", "evolução clínica", "conduta clínica");

  @Autowired private UserRepository userRepository;
  @Autowired private PatientRepository patientRepository;
  @Autowired private AppointmentRepository appointmentRepository;
  @Autowired private ChargeRepository chargeRepository;
  @Autowired private TaskRepository taskRepository;
  @Autowired private ReminderRepository reminderRepository;
  @Autowired private LeadRepository leadRepository;
  @Autowired private AuthService authService;
  @Autowired private DemoDataSeeder demoDataSeeder;
  @Autowired private Clock clock;

  private UUID demoUserId;

  @BeforeAll
  void resolveDemoUser() {
    demoUserId =
        userRepository
            .findByEmail(DemoDataSeeder.DEMO_EMAIL)
            .map(UserEntity::getId)
            .orElseThrow(() -> new AssertionError("usuária demo não foi semeada"));
  }

  @Test
  void seedsExactlyOneDemoPsychologistWithDocumentedCredentials() {
    assertThat(userRepository.findByEmail(DemoDataSeeder.DEMO_EMAIL)).isPresent();

    // As credenciais documentadas (README/docs) realmente autenticam — não é
    // só um registro solto na base.
    assertThatCode(
            () ->
                authService.login(
                    new LoginRequest(DemoDataSeeder.DEMO_EMAIL, DemoDataSeeder.DEMO_PASSWORD)))
        .doesNotThrowAnyException();
  }

  @Test
  void seedsAboutEightFictionalPatientsWithNoClinicalData() {
    List<PatientEntity> patients = patientRepository.findByUserId(demoUserId);
    assertThat(patients).hasSize(8);

    for (PatientEntity patient : patients) {
      assertThat(patient.getName()).isNotBlank();
      assertThat(patient.getMonthlyFeeCents()).isPositive();
      assertThat(patient.getBillingDay()).isBetween(1, 28);
      String notes = patient.getNotes() == null ? "" : patient.getNotes().toLowerCase(Locale.ROOT);
      for (String keyword : FORBIDDEN_CLINICAL_KEYWORDS) {
        assertThat(notes).as("notes de %s não deve conter dado clínico", patient.getName())
            .doesNotContain(keyword);
      }
    }
  }

  @Test
  void seedsATwoWeekAgendaAroundTheExecutionDate() {
    List<AppointmentEntity> appointments = appointmentRepository.findByUserId(demoUserId);
    assertThat(appointments).isNotEmpty();

    LocalDate today = LocalDate.now(clock);
    LocalDate windowStart = today.minusDays(7);
    LocalDate windowEnd = today.plusDays(7);
    for (AppointmentEntity appointment : appointments) {
      LocalDate day = appointment.getStartsAt().toLocalDate();
      assertThat(day).isBetween(windowStart, windowEnd);
    }
  }

  @Test
  void seedsChargesInAllThreePaymentStatuses() {
    List<ChargeEntity> charges = chargeRepository.findByUserId(demoUserId);
    assertThat(charges).isNotEmpty();

    List<ChargeStatus> statuses = charges.stream().map(ChargeEntity::getStatus).distinct().toList();
    assertThat(statuses)
        .as("as três situações do contrato devem estar representadas")
        .contains(ChargeStatus.EM_DIA, ChargeStatus.PENDENTE, ChargeStatus.ATRASADA);

    for (ChargeEntity charge : charges) {
      assertThat(charge.getAmountCents()).isPositive();
      if (charge.getStatus() == ChargeStatus.EM_DIA) {
        assertThat(charge.getPayment()).isNotNull();
      }
    }
  }

  @Test
  void seedsExampleTasksAndReminders() {
    List<TaskEntity> tasks = taskRepository.findByUserId(demoUserId);
    assertThat(tasks).isNotEmpty();
    assertThat(tasks).anySatisfy(task -> assertThat(task.getCompletedAt()).isNotNull());

    List<ReminderEntity> reminders = reminderRepository.findByUserId(demoUserId);
    assertThat(reminders).isNotEmpty();
  }

  @Test
  void seedsDemoLeads() {
    assertThat(leadRepository.findByEmail("renata.souza@interessada.psiops.demo")).isPresent();
    assertThat(leadRepository.findByEmail("paulo.barbosa@interessado.psiops.demo")).isPresent();
  }

  @Test
  void reRunningTheSeedIsIdempotent() {
    long usersBefore = userRepository.count();
    long patientsBefore = patientRepository.count();
    long appointmentsBefore = appointmentRepository.count();
    long chargesBefore = chargeRepository.count();
    long tasksBefore = taskRepository.count();
    long remindersBefore = reminderRepository.count();
    long leadsBefore = leadRepository.count();

    // Simula a API reiniciada no perfil demo, contra o MESMO banco.
    assertThatCode(() -> demoDataSeeder.run(new DefaultApplicationArguments()))
        .doesNotThrowAnyException();

    assertThat(userRepository.count()).isEqualTo(usersBefore);
    assertThat(patientRepository.count()).isEqualTo(patientsBefore);
    assertThat(appointmentRepository.count()).isEqualTo(appointmentsBefore);
    assertThat(chargeRepository.count()).isEqualTo(chargesBefore);
    assertThat(taskRepository.count()).isEqualTo(tasksBefore);
    assertThat(reminderRepository.count()).isEqualTo(remindersBefore);
    assertThat(leadRepository.count()).isEqualTo(leadsBefore);
  }
}
