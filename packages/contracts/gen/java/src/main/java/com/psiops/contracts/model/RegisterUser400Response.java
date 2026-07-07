package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.psiops.contracts.model.RegisterUser400ResponseAllOfViolationsInner;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.lang.Nullable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Problem Details (RFC 9457) para erros de validação de payload, com a extensão &#x60;violations&#x60; listando cada campo violado.
 */

@JsonTypeName("registerUser_400_response")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class RegisterUser400Response implements Serializable {

  private static final long serialVersionUID = 1L;

  private URI type = URI.create("about:blank");

  private String title;

  private Integer status;

  private @Nullable String detail;

  private @Nullable String instance;

  private List<@Valid RegisterUser400ResponseAllOfViolationsInner> violations = new ArrayList<>();

  public RegisterUser400Response() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public RegisterUser400Response(String title, Integer status, List<@Valid RegisterUser400ResponseAllOfViolationsInner> violations) {
    this.title = title;
    this.status = status;
    this.violations = violations;
  }

  public RegisterUser400Response type(URI type) {
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

  public RegisterUser400Response title(String title) {
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

  public RegisterUser400Response status(Integer status) {
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

  public RegisterUser400Response detail(@Nullable String detail) {
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

  public RegisterUser400Response instance(@Nullable String instance) {
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

  public RegisterUser400Response violations(List<@Valid RegisterUser400ResponseAllOfViolationsInner> violations) {
    this.violations = violations;
    return this;
  }

  public RegisterUser400Response addViolationsItem(RegisterUser400ResponseAllOfViolationsInner violationsItem) {
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
  public List<@Valid RegisterUser400ResponseAllOfViolationsInner> getViolations() {
    return violations;
  }

  @JsonProperty("violations")
  public void setViolations(List<@Valid RegisterUser400ResponseAllOfViolationsInner> violations) {
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
    RegisterUser400Response registerUser400Response = (RegisterUser400Response) o;
    return Objects.equals(this.type, registerUser400Response.type) &&
        Objects.equals(this.title, registerUser400Response.title) &&
        Objects.equals(this.status, registerUser400Response.status) &&
        Objects.equals(this.detail, registerUser400Response.detail) &&
        Objects.equals(this.instance, registerUser400Response.instance) &&
        Objects.equals(this.violations, registerUser400Response.violations);
  }

  @Override
  public int hashCode() {
    return Objects.hash(type, title, status, detail, instance, violations);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RegisterUser400Response {\n");
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

