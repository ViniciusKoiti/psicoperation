package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import org.springframework.lang.Nullable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Violação de validação de um campo específico do payload.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class FieldViolation implements Serializable {

  private static final long serialVersionUID = 1L;

  private String field;

  private String message;

  public FieldViolation() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public FieldViolation(String field, String message) {
    this.field = field;
    this.message = message;
  }

  public FieldViolation field(String field) {
    this.field = field;
    return this;
  }

  /**
   * Caminho do campo violado no payload, em camelCase (ex.: `whatsapp`, `tokens.refreshToken`).
   * @return field
   */
  @NotNull 
  @JsonProperty("field")
  public String getField() {
    return field;
  }

  @JsonProperty("field")
  public void setField(String field) {
    this.field = field;
  }

  public FieldViolation message(String message) {
    this.message = message;
    return this;
  }

  /**
   * Mensagem legível (pt-BR) descrevendo a violação.
   * @return message
   */
  @NotNull 
  @JsonProperty("message")
  public String getMessage() {
    return message;
  }

  @JsonProperty("message")
  public void setMessage(String message) {
    this.message = message;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    FieldViolation fieldViolation = (FieldViolation) o;
    return Objects.equals(this.field, fieldViolation.field) &&
        Objects.equals(this.message, fieldViolation.message);
  }

  @Override
  public int hashCode() {
    return Objects.hash(field, message);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class FieldViolation {\n");
    sb.append("    field: ").append(toIndentedString(field)).append("\n");
    sb.append("    message: ").append(toIndentedString(message)).append("\n");
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

