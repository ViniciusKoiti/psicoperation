package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.SimpleInterestParams;
import java.time.OffsetDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Configurações da conta da psicóloga.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class Settings {

  private @Nullable Long defaultMonthlyFee;

  private @Nullable Integer defaultBillingDay;

  private @Nullable SimpleInterestParams defaultInterest;

  private String timezone;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime onboardingCompletedAt;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime updatedAt;

  public Settings() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public Settings(String timezone) {
    this.timezone = timezone;
  }

  public Settings defaultMonthlyFee(@Nullable Long defaultMonthlyFee) {
    this.defaultMonthlyFee = defaultMonthlyFee;
    return this;
  }

  /**
   * Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
   * @return defaultMonthlyFee
   */
  
  @JsonProperty("defaultMonthlyFee")
  public @Nullable Long getDefaultMonthlyFee() {
    return defaultMonthlyFee;
  }

  @JsonProperty("defaultMonthlyFee")
  public void setDefaultMonthlyFee(@Nullable Long defaultMonthlyFee) {
    this.defaultMonthlyFee = defaultMonthlyFee;
  }

  public Settings defaultBillingDay(@Nullable Integer defaultBillingDay) {
    this.defaultBillingDay = defaultBillingDay;
    return this;
  }

  /**
   * Dia de vencimento padrão para novas mensalidades.
   * minimum: 1
   * maximum: 28
   * @return defaultBillingDay
   */
  @Min(value = 1) @Max(value = 28) 
  @JsonProperty("defaultBillingDay")
  public @Nullable Integer getDefaultBillingDay() {
    return defaultBillingDay;
  }

  @JsonProperty("defaultBillingDay")
  public void setDefaultBillingDay(@Nullable Integer defaultBillingDay) {
    this.defaultBillingDay = defaultBillingDay;
  }

  public Settings defaultInterest(@Nullable SimpleInterestParams defaultInterest) {
    this.defaultInterest = defaultInterest;
    return this;
  }

  /**
   * Get defaultInterest
   * @return defaultInterest
   */
  @Valid 
  @JsonProperty("defaultInterest")
  public @Nullable SimpleInterestParams getDefaultInterest() {
    return defaultInterest;
  }

  @JsonProperty("defaultInterest")
  public void setDefaultInterest(@Nullable SimpleInterestParams defaultInterest) {
    this.defaultInterest = defaultInterest;
  }

  public Settings timezone(String timezone) {
    this.timezone = timezone;
    return this;
  }

  /**
   * Fuso IANA para exibição (ex.: `America/Sao_Paulo`). O backend sempre armazena/emite em UTC; este campo orienta apenas a apresentação.
   * @return timezone
   */
  @NotNull 
  @JsonProperty("timezone")
  public String getTimezone() {
    return timezone;
  }

  @JsonProperty("timezone")
  public void setTimezone(String timezone) {
    this.timezone = timezone;
  }

  public Settings onboardingCompletedAt(@Nullable OffsetDateTime onboardingCompletedAt) {
    this.onboardingCompletedAt = onboardingCompletedAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return onboardingCompletedAt
   */
  @Valid 
  @JsonProperty("onboardingCompletedAt")
  public @Nullable OffsetDateTime getOnboardingCompletedAt() {
    return onboardingCompletedAt;
  }

  @JsonProperty("onboardingCompletedAt")
  public void setOnboardingCompletedAt(@Nullable OffsetDateTime onboardingCompletedAt) {
    this.onboardingCompletedAt = onboardingCompletedAt;
  }

  public Settings updatedAt(@Nullable OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return updatedAt
   */
  @Valid 
  @JsonProperty("updatedAt")
  public @Nullable OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  @JsonProperty("updatedAt")
  public void setUpdatedAt(@Nullable OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Settings settings = (Settings) o;
    return Objects.equals(this.defaultMonthlyFee, settings.defaultMonthlyFee) &&
        Objects.equals(this.defaultBillingDay, settings.defaultBillingDay) &&
        Objects.equals(this.defaultInterest, settings.defaultInterest) &&
        Objects.equals(this.timezone, settings.timezone) &&
        Objects.equals(this.onboardingCompletedAt, settings.onboardingCompletedAt) &&
        Objects.equals(this.updatedAt, settings.updatedAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(defaultMonthlyFee, defaultBillingDay, defaultInterest, timezone, onboardingCompletedAt, updatedAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Settings {\n");
    sb.append("    defaultMonthlyFee: ").append(toIndentedString(defaultMonthlyFee)).append("\n");
    sb.append("    defaultBillingDay: ").append(toIndentedString(defaultBillingDay)).append("\n");
    sb.append("    defaultInterest: ").append(toIndentedString(defaultInterest)).append("\n");
    sb.append("    timezone: ").append(toIndentedString(timezone)).append("\n");
    sb.append("    onboardingCompletedAt: ").append(toIndentedString(onboardingCompletedAt)).append("\n");
    sb.append("    updatedAt: ").append(toIndentedString(updatedAt)).append("\n");
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

