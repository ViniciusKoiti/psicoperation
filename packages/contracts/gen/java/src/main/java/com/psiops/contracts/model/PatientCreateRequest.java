package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Payload de cadastro de paciente.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class PatientCreateRequest {

  private String name;

  private @Nullable String whatsapp;

  private @Nullable String email;

  private Long monthlyFee;

  private Integer billingDay;

  private @Nullable String notes;

  public PatientCreateRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public PatientCreateRequest(String name, Long monthlyFee, Integer billingDay) {
    this.name = name;
    this.monthlyFee = monthlyFee;
    this.billingDay = billingDay;
  }

  public PatientCreateRequest name(String name) {
    this.name = name;
    return this;
  }

  /**
   * Get name
   * @return name
   */
  @NotNull @Size(min = 1, max = 120) 
  @JsonProperty("name")
  public String getName() {
    return name;
  }

  @JsonProperty("name")
  public void setName(String name) {
    this.name = name;
  }

  public PatientCreateRequest whatsapp(@Nullable String whatsapp) {
    this.whatsapp = whatsapp;
    return this;
  }

  /**
   * Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
   * @return whatsapp
   */
  @Pattern(regexp = "^\\+55[1-9][1-9]9[0-9]{8}$") @Size(min = 14, max = 14) 
  @JsonProperty("whatsapp")
  public @Nullable String getWhatsapp() {
    return whatsapp;
  }

  @JsonProperty("whatsapp")
  public void setWhatsapp(@Nullable String whatsapp) {
    this.whatsapp = whatsapp;
  }

  public PatientCreateRequest email(@Nullable String email) {
    this.email = email;
    return this;
  }

  /**
   * Get email
   * @return email
   */
  @Size(max = 254) @jakarta.validation.constraints.Email 
  @JsonProperty("email")
  public @Nullable String getEmail() {
    return email;
  }

  @JsonProperty("email")
  public void setEmail(@Nullable String email) {
    this.email = email;
  }

  public PatientCreateRequest monthlyFee(Long monthlyFee) {
    this.monthlyFee = monthlyFee;
    return this;
  }

  /**
   * Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
   * @return monthlyFee
   */
  @NotNull 
  @JsonProperty("monthlyFee")
  public Long getMonthlyFee() {
    return monthlyFee;
  }

  @JsonProperty("monthlyFee")
  public void setMonthlyFee(Long monthlyFee) {
    this.monthlyFee = monthlyFee;
  }

  public PatientCreateRequest billingDay(Integer billingDay) {
    this.billingDay = billingDay;
    return this;
  }

  /**
   * Get billingDay
   * minimum: 1
   * maximum: 28
   * @return billingDay
   */
  @NotNull @Min(value = 1) @Max(value = 28) 
  @JsonProperty("billingDay")
  public Integer getBillingDay() {
    return billingDay;
  }

  @JsonProperty("billingDay")
  public void setBillingDay(Integer billingDay) {
    this.billingDay = billingDay;
  }

  public PatientCreateRequest notes(@Nullable String notes) {
    this.notes = notes;
    return this;
  }

  /**
   * Get notes
   * @return notes
   */
  @Size(max = 2000) 
  @JsonProperty("notes")
  public @Nullable String getNotes() {
    return notes;
  }

  @JsonProperty("notes")
  public void setNotes(@Nullable String notes) {
    this.notes = notes;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    PatientCreateRequest patientCreateRequest = (PatientCreateRequest) o;
    return Objects.equals(this.name, patientCreateRequest.name) &&
        Objects.equals(this.whatsapp, patientCreateRequest.whatsapp) &&
        Objects.equals(this.email, patientCreateRequest.email) &&
        Objects.equals(this.monthlyFee, patientCreateRequest.monthlyFee) &&
        Objects.equals(this.billingDay, patientCreateRequest.billingDay) &&
        Objects.equals(this.notes, patientCreateRequest.notes);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, whatsapp, email, monthlyFee, billingDay, notes);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class PatientCreateRequest {\n");
    sb.append("    name: ").append(toIndentedString(name)).append("\n");
    sb.append("    whatsapp: ").append(toIndentedString(whatsapp)).append("\n");
    sb.append("    email: ").append(toIndentedString(email)).append("\n");
    sb.append("    monthlyFee: ").append(toIndentedString(monthlyFee)).append("\n");
    sb.append("    billingDay: ").append(toIndentedString(billingDay)).append("\n");
    sb.append("    notes: ").append(toIndentedString(notes)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(@Nullable Object o) {
    return o == null ? "null" : o.toString().replace("\n", "\n    ");
  }
}

