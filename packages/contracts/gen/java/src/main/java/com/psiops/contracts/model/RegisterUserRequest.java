package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonTypeName;
import org.springframework.lang.Nullable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Payload de criação de conta.
 */

@JsonTypeName("registerUser_request")
@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class RegisterUserRequest implements Serializable {

  private static final long serialVersionUID = 1L;

  private String name;

  private String email;

  private String password;

  public RegisterUserRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public RegisterUserRequest(String name, String email, String password) {
    this.name = name;
    this.email = email;
    this.password = password;
  }

  public RegisterUserRequest name(String name) {
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

  public RegisterUserRequest email(String email) {
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

  public RegisterUserRequest password(String password) {
    this.password = password;
    return this;
  }

  /**
   * Senha em texto claro (transporte sempre via TLS). Mínimo de 8 caracteres; máximo de 72 bytes (limite do BCrypt usado no backend).
   * @return password
   */
  @NotNull @Size(min = 8, max = 72) 
  @JsonProperty("password")
  public String getPassword() {
    return password;
  }

  @JsonProperty("password")
  public void setPassword(String password) {
    this.password = password;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    RegisterUserRequest registerUserRequest = (RegisterUserRequest) o;
    return Objects.equals(this.name, registerUserRequest.name) &&
        Objects.equals(this.email, registerUserRequest.email) &&
        Objects.equals(this.password, registerUserRequest.password);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, email, password);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class RegisterUserRequest {\n");
    sb.append("    name: ").append(toIndentedString(name)).append("\n");
    sb.append("    email: ").append(toIndentedString(email)).append("\n");
    sb.append("    password: ").append("*").append("\n");
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

