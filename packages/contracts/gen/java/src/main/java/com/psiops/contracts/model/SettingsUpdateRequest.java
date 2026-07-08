package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.SimpleInterestParams;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Atualização das configurações. Campos opcionais.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class SettingsUpdateRequest {

  private @Nullable Long defaultMonthlyFee;

  private @Nullable Integer defaultBillingDay;

  private @Nullable SimpleInterestParams defaultInterest;

  private @Nullable String timezone;

  public SettingsUpdateRequest defaultMonthlyFee(@Nullable Long defaultMonthlyFee) {
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

  public SettingsUpdateRequest defaultBillingDay(@Nullable Integer defaultBillingDay) {
    this.defaultBillingDay = defaultBillingDay;
    return this;
  }

  /**
   * Get defaultBillingDay
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

  public SettingsUpdateRequest defaultInterest(@Nullable SimpleInterestParams defaultInterest) {
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

  public SettingsUpdateRequest timezone(@Nullable String timezone) {
    this.timezone = timezone;
    return this;
  }

  /**
   * Get timezone
   * @return timezone
   */
  
  @JsonProperty("timezone")
  public @Nullable String getTimezone() {
    return timezone;
  }

  @JsonProperty("timezone")
  public void setTimezone(@Nullable String timezone) {
    this.timezone = timezone;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    SettingsUpdateRequest settingsUpdateRequest = (SettingsUpdateRequest) o;
    return Objects.equals(this.defaultMonthlyFee, settingsUpdateRequest.defaultMonthlyFee) &&
        Objects.equals(this.defaultBillingDay, settingsUpdateRequest.defaultBillingDay) &&
        Objects.equals(this.defaultInterest, settingsUpdateRequest.defaultInterest) &&
        Objects.equals(this.timezone, settingsUpdateRequest.timezone);
  }

  @Override
  public int hashCode() {
    return Objects.hash(defaultMonthlyFee, defaultBillingDay, defaultInterest, timezone);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class SettingsUpdateRequest {\n");
    sb.append("    defaultMonthlyFee: ").append(toIndentedString(defaultMonthlyFee)).append("\n");
    sb.append("    defaultBillingDay: ").append(toIndentedString(defaultBillingDay)).append("\n");
    sb.append("    defaultInterest: ").append(toIndentedString(defaultInterest)).append("\n");
    sb.append("    timezone: ").append(toIndentedString(timezone)).append("\n");
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

