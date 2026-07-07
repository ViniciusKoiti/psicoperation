package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonTypeName;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Conta da psicóloga autenticável no PsiOps.
 */

@JsonTypeName("registerUser_201_response_user")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class RegisterUser201ResponseUser implements Serializable {

  private static final long serialVersionUID = 1L;

  private UUID id;

  private String name;

  private String email;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime createdAt;

  public RegisterUser201ResponseUser() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public RegisterUser201ResponseUser(UUID id, String name, String email, OffsetDateTime createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = createdAt;
  }

  public RegisterUser201ResponseUser id(UUID id) {
    this.id = id;
    return this;
  }

  /**
   * Identificador único da conta.
   * @return id
   */
  @NotNull @Valid 
  @JsonProperty("id")
  public UUID getId() {
    return id;
  }

  @JsonProperty("id")
  public void setId(UUID id) {
    this.id = id;
  }

  public RegisterUser201ResponseUser name(String name) {
    this.name = name;
    return this;
  }

  /**
   * Nome completo.
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

  public RegisterUser201ResponseUser email(String email) {
    this.email = email;
    return this;
  }

  /**
   * E-mail de login (único por conta).
   * @return email
   */
  @NotNull @Size(max = 254) @jakarta.validation.constraints.Email 
  @JsonProperty("email")
  public String getEmail() {
    return email;
  }

  @JsonProperty("email")
  public void setEmail(String email) {
    this.email = email;
  }

  public RegisterUser201ResponseUser createdAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  /**
   * Instante de criação da conta (ISO 8601, UTC).
   * @return createdAt
   */
  @NotNull @Valid 
  @JsonProperty("createdAt")
  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  @JsonProperty("createdAt")
  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    RegisterUser201ResponseUser registerUser201ResponseUser = (RegisterUser201ResponseUser) o;
    return Objects.equals(this.id, registerUser201ResponseUser.id) &&
        Objects.equals(this.name, registerUser201ResponseUser.name) &&
        Objects.equals(this.email, registerUser201ResponseUser.email) &&
        Objects.equals(this.createdAt, registerUser201ResponseUser.createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, name, email, createdAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RegisterUser201ResponseUser {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    name: ").append(toIndentedString(name)).append("\n");
    sb.append("    email: ").append(toIndentedString(email)).append("\n");
    sb.append("    createdAt: ").append(toIndentedString(createdAt)).append("\n");
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

