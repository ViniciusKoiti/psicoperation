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
 * Parâmetros de juros SIMPLES aplicados sobre cobrança atrasada. O cálculo do montante devido é responsabilidade da API; aqui vão apenas os parâmetros.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class SimpleInterestParams {

  private Double monthlyRatePercent;

  private Double finePercent;

  public SimpleInterestParams() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public SimpleInterestParams(Double monthlyRatePercent, Double finePercent) {
    this.monthlyRatePercent = monthlyRatePercent;
    this.finePercent = finePercent;
  }

  public SimpleInterestParams monthlyRatePercent(Double monthlyRatePercent) {
    this.monthlyRatePercent = monthlyRatePercent;
    return this;
  }

  /**
   * Percentual de juros ao mês (ex.: 1.0 = 1% a.m.), aplicado de forma linear (simples) por período de atraso.
   * minimum: 0
   * maximum: 100
   * @return monthlyRatePercent
   */
  @NotNull @DecimalMin(value = "0") @DecimalMax(value = "100") 
  @JsonProperty("monthlyRatePercent")
  public Double getMonthlyRatePercent() {
    return monthlyRatePercent;
  }

  @JsonProperty("monthlyRatePercent")
  public void setMonthlyRatePercent(Double monthlyRatePercent) {
    this.monthlyRatePercent = monthlyRatePercent;
  }

  public SimpleInterestParams finePercent(Double finePercent) {
    this.finePercent = finePercent;
    return this;
  }

  /**
   * Percentual de multa única aplicada no vencimento (ex.: 2.0 = 2%).
   * minimum: 0
   * maximum: 100
   * @return finePercent
   */
  @NotNull @DecimalMin(value = "0") @DecimalMax(value = "100") 
  @JsonProperty("finePercent")
  public Double getFinePercent() {
    return finePercent;
  }

  @JsonProperty("finePercent")
  public void setFinePercent(Double finePercent) {
    this.finePercent = finePercent;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    SimpleInterestParams simpleInterestParams = (SimpleInterestParams) o;
    return Objects.equals(this.monthlyRatePercent, simpleInterestParams.monthlyRatePercent) &&
        Objects.equals(this.finePercent, simpleInterestParams.finePercent);
  }

  @Override
  public int hashCode() {
    return Objects.hash(monthlyRatePercent, finePercent);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class SimpleInterestParams {\n");
    sb.append("    monthlyRatePercent: ").append(toIndentedString(monthlyRatePercent)).append("\n");
    sb.append("    finePercent: ").append(toIndentedString(finePercent)).append("\n");
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

