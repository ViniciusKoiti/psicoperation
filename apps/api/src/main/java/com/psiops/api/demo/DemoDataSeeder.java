package com.psiops.api.demo;

import com.psiops.api.appointment.application.AppointmentService;
import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.auth.application.AuthService;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.billing.application.ChargeService;
import com.psiops.api.billing.persistence.ChargeEntity;
import com.psiops.api.billing.persistence.ChargeRepository;
import com.psiops.api.lead.application.LeadService;
import com.psiops.api.patient.application.PatientService;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.reminder.application.ReminderService;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.task.application.TaskService;
import com.psiops.api.task.persistence.TaskEntity;
import com.psiops.api.task.persistence.TaskRepository;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Charge;
import com.psiops.contracts.model.CreateChargeRequest;
import com.psiops.contracts.model.LeadCreateRequest;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.PaymentMethod;
import com.psiops.contracts.model.RegisterPaymentRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.ReminderChannel;
import com.psiops.contracts.model.ReminderCreateRequest;
import com.psiops.contracts.model.Task;
import com.psiops.contracts.model.TaskCreateRequest;
import com.psiops.contracts.model.TaskUpdateRequest;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seed de dados de demonstração do MVP (PSI-046), ativo SOMENTE no perfil
 * Spring {@code demo} ({@code SPRING_PROFILES_ACTIVE=demo}) — nenhum outro
 * perfil (dev, test, produção) registra este {@link ApplicationRunner}, por
 * construção do {@link Profile}.
 *
 * <p><strong>Nunca uma migration</strong>: dado de demonstração não é
 * schema; este é código de aplicação comum, que roda uma única vez por
 * inicialização e usa os MESMOS casos de uso (serviços) que a API expõe via
 * HTTP — nunca {@code INSERT} cru contornando as regras de domínio (a única
 * exceção natural são as consultas de leitura aos repositórios, usadas
 * apenas para decidir o que falta criar).
 *
 * <p><strong>Idempotência robusta</strong> (risco do manifesto: "idempotência
 * ingênua... pode deixar dados parciais em reexecuções após falha"): cada
 * tipo de entidade (usuária, pacientes, consultas, cobranças, tarefas,
 * lembretes, leads) é conferido e completado INDEPENDENTEMENTE — a checagem
 * nunca é "a usuária demo já existe, então não faço mais nada"; é sempre "o
 * que já existe deste tipo, e o que falta". Isso garante que uma reexecução
 * após uma falha no meio do caminho complete o que faltou, sem duplicar o
 * que já foi criado.
 *
 * <p><strong>Determinismo relativo à data de execução</strong> (risco do
 * manifesto): a agenda (2 semanas em torno de hoje) e os vencimentos das
 * mensalidades de demonstração são calculados a partir de {@link Clock},
 * nunca de {@code LocalDate.now()}/{@code OffsetDateTime.now()} sem
 * argumento — ver {@link DemoDatePlanner}, testada isoladamente com relógio
 * fixo em {@code DemoDatePlannerTest}. O restante do domínio (ex.: detecção
 * de atraso em {@code ChargeService}) continua no relógio real do sistema,
 * como em produção; os deslocamentos usados aqui (±15/20 dias) são
 * generosos o suficiente para que isso nunca produza um status inconsistente
 * em execução normal (ver {@code ChargeFlowIntegrationTest} para a regra em
 * si, inalterada por esta tarefa).
 *
 * <p><strong>Sem dado clínico</strong>: nenhum paciente, consulta, cobrança,
 * tarefa ou lembrete de demonstração carrega diagnóstico, evolução, queixa
 * ou qualquer informação de saúde — apenas dados administrativos e de
 * cobrança (nome, WhatsApp, e-mail, valores em centavos, datas), como já
 * garantido pelos próprios contratos consumidos aqui.
 *
 * <p><strong>Credenciais da psicóloga demo</strong> (públicas e fixas,
 * exclusivas do perfil demo local — documentadas em {@code README.md} e
 * {@code docs/setup.md}): e-mail {@value #DEMO_EMAIL}, senha {@value
 * #DEMO_PASSWORD}.
 */
@Component
@Profile("demo")
public class DemoDataSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

  /** E-mail de login da psicóloga demo — fixo e documentado (ver javadoc da classe). */
  public static final String DEMO_EMAIL = "demo@psiops.com.br";

  /** Senha da psicóloga demo — fixa e documentada (ver javadoc da classe). */
  public static final String DEMO_PASSWORD = "PsiopsDemo123!";

  private static final String DEMO_NAME = "Dra. Ana Beatriz Cardoso (demo)";

  /**
   * Horários de consulta em UTC (armazenamento canônico do contrato):
   * equivalem a 09h e 12h no fuso America/Sao_Paulo (UTC-3), horário
   * plausível de atendimento.
   */
  private static final List<LocalTime> AGENDA_SLOTS = List.of(LocalTime.of(12, 0), LocalTime.of(15, 0));

  private static final int APPOINTMENT_DURATION_MINUTES = 50;

  /** ~8 pacientes fictícios (dados administrativos/cobrança apenas — nenhum dado clínico). */
  private static final List<PatientSpec> PATIENT_SPECS =
      List.of(
          new PatientSpec(
              "Marina Alves", "11", 23445001, "marina.alves@paciente.psiops.demo", 18000, 5,
              "Prefere contato por WhatsApp após 18h."),
          new PatientSpec(
              "Beatriz Andrade", "21", 23445002, "beatriz.andrade@paciente.psiops.demo", 20000, 10,
              "Combinou pagamento via Pix até o dia 10."),
          new PatientSpec(
              "Camila Duarte", "31", 23445003, "camila.duarte@paciente.psiops.demo", 15000, 15, null),
          new PatientSpec(
              "Fernanda Rocha", "41", 23445004, "fernanda.rocha@paciente.psiops.demo", 16000, 20,
              "Recibo mensal por e-mail."),
          new PatientSpec(
              "Gabriel Nunes", "51", 23445005, "gabriel.nunes@paciente.psiops.demo", 22000, 5, null),
          new PatientSpec(
              "Henrique Melo", "61", 23445006, "henrique.melo@paciente.psiops.demo", 19000, 10,
              "Atendimento quinzenal."),
          new PatientSpec(
              "Isabela Cardoso", "71", 23445007, "isabela.cardoso@paciente.psiops.demo", 17000, 15, null),
          new PatientSpec(
              "Lucas Teixeira", "81", 23445008, "lucas.teixeira@paciente.psiops.demo", 21000, 20,
              "Prefere lembrete por e-mail, não WhatsApp."));

  private final UserRepository userRepository;
  private final AuthService authService;
  private final PatientRepository patientRepository;
  private final PatientService patientService;
  private final AppointmentRepository appointmentRepository;
  private final AppointmentService appointmentService;
  private final ChargeRepository chargeRepository;
  private final ChargeService chargeService;
  private final TaskRepository taskRepository;
  private final TaskService taskService;
  private final ReminderRepository reminderRepository;
  private final ReminderService reminderService;
  private final LeadService leadService;
  private final Clock clock;

  public DemoDataSeeder(
      UserRepository userRepository,
      AuthService authService,
      PatientRepository patientRepository,
      PatientService patientService,
      AppointmentRepository appointmentRepository,
      AppointmentService appointmentService,
      ChargeRepository chargeRepository,
      ChargeService chargeService,
      TaskRepository taskRepository,
      TaskService taskService,
      ReminderRepository reminderRepository,
      ReminderService reminderService,
      LeadService leadService,
      Clock clock) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.patientRepository = patientRepository;
    this.patientService = patientService;
    this.appointmentRepository = appointmentRepository;
    this.appointmentService = appointmentService;
    this.chargeRepository = chargeRepository;
    this.chargeService = chargeService;
    this.taskRepository = taskRepository;
    this.taskService = taskService;
    this.reminderRepository = reminderRepository;
    this.reminderService = reminderService;
    this.leadService = leadService;
    this.clock = clock;
  }

  @Override
  public void run(ApplicationArguments args) {
    log.info("seed demo: iniciando (perfil 'demo' ativo, data de execução {})", DemoDatePlanner.today(clock));

    UUID demoUserId = ensureDemoUser();
    List<PatientEntity> patients = ensureDemoPatients(demoUserId);
    ensureDemoAgenda(demoUserId, patients);
    ensureDemoCharges(demoUserId, patients);
    ensureDemoTasks(demoUserId);
    ensureDemoReminders(demoUserId, patients);
    ensureDemoLeads();

    log.info("seed demo: concluído (usuária demo: {})", DEMO_EMAIL);
  }

  private UUID ensureDemoUser() {
    return userRepository
        .findByEmail(DEMO_EMAIL)
        .map(user -> user.getId())
        .orElseGet(
            () -> {
              AuthResponse response =
                  authService.register(new RegisterRequest(DEMO_NAME, DEMO_EMAIL, DEMO_PASSWORD));
              log.info("seed demo: usuária demo criada ({})", DEMO_EMAIL);
              return response.getUser().getId();
            });
  }

  /** Garante os ~8 pacientes fictícios, na mesma ordem de {@link #PATIENT_SPECS}. */
  private List<PatientEntity> ensureDemoPatients(UUID demoUserId) {
    Map<String, PatientEntity> existingByName =
        patientRepository.findByUserId(demoUserId).stream()
            .collect(Collectors.toMap(PatientEntity::getName, p -> p, (a, b) -> a, LinkedHashMap::new));

    for (PatientSpec spec : PATIENT_SPECS) {
      if (existingByName.containsKey(spec.name())) {
        continue;
      }
      PatientCreateRequest request =
          new PatientCreateRequest(spec.name(), spec.monthlyFeeCents(), spec.billingDay())
              .whatsapp(spec.whatsapp())
              .email(spec.email())
              .notes(spec.notes());
      patientService.create(demoUserId, request);
    }

    // Releitura única no final: cada criação acima persiste imediatamente
    // (PatientService#create não é adiado), então a segunda consulta já
    // reflete tanto os pacientes pré-existentes quanto os recém-criados.
    Map<String, PatientEntity> finalByName =
        patientRepository.findByUserId(demoUserId).stream()
            .collect(Collectors.toMap(PatientEntity::getName, p -> p, (a, b) -> a));
    return PATIENT_SPECS.stream().map(spec -> finalByName.get(spec.name())).collect(Collectors.toList());
  }

  /** Agenda de 2 semanas (dias úteis) em torno da data de execução — ver {@link DemoDatePlanner}. */
  private void ensureDemoAgenda(UUID demoUserId, List<PatientEntity> patients) {
    List<LocalDate> weekdays = DemoDatePlanner.agendaWeekdays(clock);
    Set<String> existingKeys =
        appointmentRepository.findByUserId(demoUserId).stream()
            .map(a -> occurrenceKey(a.getPatientId(), a.getStartsAt()))
            .collect(Collectors.toSet());

    for (int i = 0; i < weekdays.size(); i++) {
      PatientEntity patient = patients.get(i % patients.size());
      LocalTime slot = AGENDA_SLOTS.get(i % AGENDA_SLOTS.size());
      OffsetDateTime startsAt = OffsetDateTime.of(weekdays.get(i), slot, ZoneOffset.UTC);

      if (existingKeys.contains(occurrenceKey(patient.getId(), startsAt))) {
        continue;
      }
      appointmentService.create(
          demoUserId, new AppointmentCreateRequest(patient.getId(), startsAt, APPOINTMENT_DURATION_MINUTES));
    }
  }

  private String occurrenceKey(UUID patientId, OffsetDateTime startsAt) {
    return patientId + "@" + startsAt;
  }

  /** Uma mensalidade em cada um dos três status do contrato: em dia, pendente e atrasada. */
  private void ensureDemoCharges(UUID demoUserId, List<PatientEntity> patients) {
    String competence = DemoDatePlanner.currentCompetence(clock);
    ensureEmDiaCharge(demoUserId, patients.get(0), competence);
    ensurePendenteCharge(demoUserId, patients.get(1), competence);
    ensureAtrasadaCharge(demoUserId, patients.get(2), competence);
  }

  private boolean chargeAlreadyExists(UUID demoUserId, UUID patientId, String competence) {
    return chargeRepository.findByUserIdAndCompetence(demoUserId, competence).stream()
        .anyMatch(charge -> charge.getPatientId().equals(patientId));
  }

  private void ensureEmDiaCharge(UUID demoUserId, PatientEntity patient, String competence) {
    if (chargeAlreadyExists(demoUserId, patient.getId(), competence)) {
      return;
    }
    LocalDate dueDate = DemoDatePlanner.emDiaDueDate(clock);
    Charge charge =
        chargeService.create(
            demoUserId,
            new CreateChargeRequest(patient.getId(), competence, patient.getMonthlyFeeCents(), dueDate));
    RegisterPaymentRequest payment =
        new RegisterPaymentRequest(patient.getMonthlyFeeCents(), OffsetDateTime.now(clock), PaymentMethod.PIX)
            .note("Pagamento de demonstração (seed).");
    chargeService.registerPayment(demoUserId, charge.getId(), payment);
  }

  private void ensurePendenteCharge(UUID demoUserId, PatientEntity patient, String competence) {
    if (chargeAlreadyExists(demoUserId, patient.getId(), competence)) {
      return;
    }
    LocalDate dueDate = DemoDatePlanner.pendenteDueDate(clock);
    chargeService.create(
        demoUserId, new CreateChargeRequest(patient.getId(), competence, patient.getMonthlyFeeCents(), dueDate));
  }

  private void ensureAtrasadaCharge(UUID demoUserId, PatientEntity patient, String competence) {
    if (chargeAlreadyExists(demoUserId, patient.getId(), competence)) {
      return;
    }
    LocalDate dueDate = DemoDatePlanner.atrasadaDueDate(clock);
    // ChargeService#create já varre e marca ATRASADA (relógio real do
    // sistema) as cobranças pendentes vencidas na mesma chamada — ver
    // javadoc da classe sobre a folga de 20 dias tornar isso seguro mesmo
    // sob um relógio de teste levemente distinto do relógio real.
    chargeService.create(
        demoUserId, new CreateChargeRequest(patient.getId(), competence, patient.getMonthlyFeeCents(), dueDate));
  }

  private void ensureDemoTasks(UUID demoUserId) {
    LocalDate today = DemoDatePlanner.today(clock);
    Map<String, TaskEntity> existingByTitle =
        taskRepository.findByUserId(demoUserId).stream()
            .collect(Collectors.toMap(TaskEntity::getTitle, t -> t, (a, b) -> a));

    ensureTask(demoUserId, existingByTitle, "Emitir recibo do mês para Marina Alves", today.plusDays(2), false);
    ensureTask(demoUserId, existingByTitle, "Revisar cobranças em atraso", today, false);
    ensureTask(demoUserId, existingByTitle, "Atualizar tabela de valores 2026", null, true);
  }

  private void ensureTask(
      UUID demoUserId, Map<String, TaskEntity> existingByTitle, String title, LocalDate dueDate, boolean completeIt) {
    TaskEntity existing = existingByTitle.get(title);
    if (existing == null) {
      TaskCreateRequest request = new TaskCreateRequest(title);
      if (dueDate != null) {
        request.dueDate(dueDate);
      }
      Task created = taskService.create(demoUserId, request);
      if (completeIt) {
        taskService.update(
            demoUserId, created.getId(), new TaskUpdateRequest().completedAt(OffsetDateTime.now(clock)));
      }
      return;
    }
    if (completeIt && existing.getCompletedAt() == null) {
      taskService.update(
          demoUserId, existing.getId(), new TaskUpdateRequest().completedAt(OffsetDateTime.now(clock)));
    }
  }

  /** Dois lembretes manuais de exemplo — além dos automáticos de véspera/dia gerados pela agenda (PSI-029). */
  private void ensureDemoReminders(UUID demoUserId, List<PatientEntity> patients) {
    Set<String> existingSubjects =
        reminderRepository.findByUserId(demoUserId).stream()
            .map(ReminderEntity::getSubject)
            .collect(Collectors.toSet());
    OffsetDateTime scheduledFor =
        OffsetDateTime.of(DemoDatePlanner.today(clock).plusDays(3), LocalTime.of(12, 0), ZoneOffset.UTC);

    createReminderIfMissing(
        demoUserId,
        existingSubjects,
        "Renovar CRP",
        "Verificar a validade da carteira do conselho profissional.",
        scheduledFor,
        null);
    createReminderIfMissing(
        demoUserId,
        existingSubjects,
        "Confirmar presença - " + patients.get(1).getName(),
        "Enviar lembrete de confirmação da próxima sessão.",
        scheduledFor,
        patients.get(1).getId());
  }

  private void createReminderIfMissing(
      UUID demoUserId,
      Set<String> existingSubjects,
      String subject,
      String body,
      OffsetDateTime scheduledFor,
      UUID patientId) {
    if (existingSubjects.contains(subject)) {
      return;
    }
    ReminderCreateRequest request =
        new ReminderCreateRequest(ReminderChannel.EMAIL, subject, body, scheduledFor);
    if (patientId != null) {
      request.patientId(patientId);
    }
    reminderService.create(demoUserId, request);
  }

  private void ensureDemoLeads() {
    // LeadService#create já é idempotente por e-mail normalizado (ver seu
    // javadoc) — chamar de novo em toda reexecução não duplica.
    leadService.create(
        new LeadCreateRequest("Renata Souza", "+5511998001001", "renata.souza@interessada.psiops.demo"));
    leadService.create(
        new LeadCreateRequest("Paulo Barbosa", "+5521998001002", "paulo.barbosa@interessado.psiops.demo"));
  }

  /** Dados fictícios administrativos/de cobrança de um paciente demo — nenhum campo clínico. */
  private record PatientSpec(
      String name,
      String ddd,
      int whatsappSuffix,
      String email,
      long monthlyFeeCents,
      int billingDay,
      String notes) {

    String whatsapp() {
      return "+55" + ddd + "9" + String.format("%08d", whatsappSuffix);
    }
  }
}
