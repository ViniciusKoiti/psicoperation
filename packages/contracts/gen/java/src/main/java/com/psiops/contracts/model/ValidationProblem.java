package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.FieldViolation;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Problem Details (RFC 9457) para erros de validação de payload, com a extensão &#x60;violations&#x60; listando cada campo violado.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class ValidationProblem {

  private URI type = URI.create("about:blank");

  private String title;

  private Integer status;

  private @Nullable String detail;

  private @Nullable String instance;

  private List<@Valid FieldViolation> violations = new ArrayList<>();

  public ValidationProblem() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public ValidationProblem(String title, Integer status, List<@Valid FieldViolation> violations) {
    this.title = title;
    this.status = status;
    this.violations = violations;
  }

  public ValidationProblem type(URI type) {
    this.type = type;
    return this;
  }

  /**
   * URI que identifica o tipo do problema. `about:blank` quando o erro é totalmente descrito pelo status HTTP.
   * @return type
   */
  @Valid 
  @JsonProperty("type")
  public URI getType() {
    return type;
  }

  @JsonProperty("type")
  public void setType(URI type) {
    this.type = type;
  }

  public ValidationProblem title(String title) {
    this.title = title;
    return this;
  }

  /**
   * Resumo curto e legível do tipo de problema (pt-BR). Não muda entre ocorrências do mesmo tipo.
   * @return title
   */
  @NotNull 
  @JsonProperty("title")
  public String getTitle() {
    return title;
  }

  @JsonProperty("title")
  public void setTitle(String title) {
    this.title = title;
  }

  public ValidationProblem status(Integer status) {
    this.status = status;
    return this;
  }

  /**
   * Código de status HTTP gerado pelo servidor para esta ocorrência.
   * minimum: 100
   * maximum: 599
   * @return status
   */
  @NotNull @Min(value = 100) @Max(value = 599) 
  @JsonProperty("status")
  public Integer getStatus() {
    return status;
  }

  @JsonProperty("status")
  public void setStatus(Integer status) {
    this.status = status;
  }

  public ValidationProblem detail(@Nullable String detail) {
    this.detail = detail;
    return this;
  }

  /**
   * Explicação legível (pt-BR) específica desta ocorrência.
   * @return detail
   */
  
  @JsonProperty("detail")
  public @Nullable String getDetail() {
    return detail;
  }

  @JsonProperty("detail")
  public void setDetail(@Nullable String detail) {
    this.detail = detail;
  }

  public ValidationProblem instance(@Nullable String instance) {
    this.instance = instance;
    return this;
  }

  /**
   * Referência URI (RFC 9457 permite relativa) que identifica esta ocorrência específica do problema.
   * @return instance
   */
  
  @JsonProperty("instance")
  public @Nullable String getInstance() {
    return instance;
  }

  @JsonProperty("instance")
  public void setInstance(@Nullable String instance) {
    this.instance = instance;
  }

  public ValidationProblem violations(List<@Valid FieldViolation> violations) {
    this.violations = violations;
    return this;
  }

  public ValidationProblem addViolationsItem(FieldViolation violationsItem) {
    if (this.violations == null) {
      this.violations = new ArrayList<>();
    }
    this.violations.add(violationsItem);
    return this;
  }

  /**
   * Lista de violações por campo (ao menos uma).
   * @return violations
   */
  @NotNull @Valid @Size(min = 1) 
  @JsonProperty("violations")
  public List<@Valid FieldViolation> getViolations() {
    return violations;
  }

  @JsonProperty("violations")
  public void setViolations(List<@Valid FieldViolation> violations) {
    this.violations = violations;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ValidationProblem validationProblem = (ValidationProblem) o;
    return Objects.equals(this.type, validationProblem.type) &&
        Objects.equals(this.title, validationProblem.title) &&
        Objects.equals(this.status, validationProblem.status) &&
        Objects.equals(this.detail, validationProblem.detail) &&
        Objects.equals(this.instance, validationProblem.instance) &&
        Objects.equals(this.violations, validationProblem.violations);
  }

  @Override
  public int hashCode() {
    return Objects.hash(type, title, status, detail, instance, violations);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ValidationProblem {\n");
    sb.append("    type: ").append(toIndentedString(type)).append("\n");
    sb.append("    title: ").append(toIndentedString(title)).append("\n");
    sb.append("    status: ").append(toIndentedString(status)).append("\n");
    sb.append("    detail: ").append(toIndentedString(detail)).append("\n");
    sb.append("    instance: ").append(toIndentedString(instance)).append("\n");
    sb.append("    violations: ").append(toIndentedString(violations)).append("\n");
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

