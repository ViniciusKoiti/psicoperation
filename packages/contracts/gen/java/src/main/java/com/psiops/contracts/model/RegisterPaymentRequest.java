package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.PaymentMethod;
import java.time.OffsetDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Payload para registrar o pagamento de uma cobrança.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class RegisterPaymentRequest {

  private Long paidAmount;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime paidAt;

  private PaymentMethod method;

  private @Nullable String note;

  public RegisterPaymentRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public RegisterPaymentRequest(Long paidAmount, OffsetDateTime paidAt, PaymentMethod method) {
    this.paidAmount = paidAmount;
    this.paidAt = paidAt;
    this.method = method;
  }

  public RegisterPaymentRequest paidAmount(Long paidAmount) {
    this.paidAmount = paidAmount;
    return this;
  }

  /**
   * Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
   * @return paidAmount
   */
  @NotNull 
  @JsonProperty("paidAmount")
  public Long getPaidAmount() {
    return paidAmount;
  }

  @JsonProperty("paidAmount")
  public void setPaidAmount(Long paidAmount) {
    this.paidAmount = paidAmount;
  }

  public RegisterPaymentRequest paidAt(OffsetDateTime paidAt) {
    this.paidAt = paidAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return paidAt
   */
  @NotNull @Valid 
  @JsonProperty("paidAt")
  public OffsetDateTime getPaidAt() {
    return paidAt;
  }

  @JsonProperty("paidAt")
  public void setPaidAt(OffsetDateTime paidAt) {
    this.paidAt = paidAt;
  }

  public RegisterPaymentRequest method(PaymentMethod method) {
    this.method = method;
    return this;
  }

  /**
   * Get method
   * @return method
   */
  @NotNull @Valid 
  @JsonProperty("method")
  public PaymentMethod getMethod() {
    return method;
  }

  @JsonProperty("method")
  public void setMethod(PaymentMethod method) {
    this.method = method;
  }

  public RegisterPaymentRequest note(@Nullable String note) {
    this.note = note;
    return this;
  }

  /**
   * Get note
   * @return note
   */
  @Size(max = 500) 
  @JsonProperty("note")
  public @Nullable String getNote() {
    return note;
  }

  @JsonProperty("note")
  public void setNote(@Nullable String note) {
    this.note = note;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    RegisterPaymentRequest registerPaymentRequest = (RegisterPaymentRequest) o;
    return Objects.equals(this.paidAmount, registerPaymentRequest.paidAmount) &&
        Objects.equals(this.paidAt, registerPaymentRequest.paidAt) &&
        Objects.equals(this.method, registerPaymentRequest.method) &&
        Objects.equals(this.note, registerPaymentRequest.note);
  }

  @Override
  public int hashCode() {
    return Objects.hash(paidAmount, paidAt, method, note);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RegisterPaymentRequest {\n");
    sb.append("    paidAmount: ").append(toIndentedString(paidAmount)).append("\n");
    sb.append("    paidAt: ").append(toIndentedString(paidAt)).append("\n");
    sb.append("    method: ").append(toIndentedString(method)).append("\n");
    sb.append("    note: ").append(toIndentedString(note)).append("\n");
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

