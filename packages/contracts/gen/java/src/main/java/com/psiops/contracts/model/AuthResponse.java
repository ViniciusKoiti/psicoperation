package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.RegisterUser201ResponseTokens;
import com.psiops.contracts.model.RegisterUser201ResponseUser;
import org.springframework.lang.Nullable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Resposta de registro e login — conta autenticada + tokens.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class AuthResponse implements Serializable {

  private static final long serialVersionUID = 1L;

  private RegisterUser201ResponseUser user;

  private RegisterUser201ResponseTokens tokens;

  public AuthResponse() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public AuthResponse(RegisterUser201ResponseUser user, RegisterUser201ResponseTokens tokens) {
    this.user = user;
    this.tokens = tokens;
  }

  public AuthResponse user(RegisterUser201ResponseUser user) {
    this.user = user;
    return this;
  }

  /**
   * Get user
   * @return user
   */
  @NotNull @Valid 
  @JsonProperty("user")
  public RegisterUser201ResponseUser getUser() {
    return user;
  }

  @JsonProperty("user")
  public void setUser(RegisterUser201ResponseUser user) {
    this.user = user;
  }

  public AuthResponse tokens(RegisterUser201ResponseTokens tokens) {
    this.tokens = tokens;
    return this;
  }

  /**
   * Get tokens
   * @return tokens
   */
  @NotNull @Valid 
  @JsonProperty("tokens")
  public RegisterUser201ResponseTokens getTokens() {
    return tokens;
  }

  @JsonProperty("tokens")
  public void setTokens(RegisterUser201ResponseTokens tokens) {
    this.tokens = tokens;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    AuthResponse authResponse = (AuthResponse) o;
    return Objects.equals(this.user, authResponse.user) &&
        Objects.equals(this.tokens, authResponse.tokens);
  }

  @Override
  public int hashCode() {
    return Objects.hash(user, tokens);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class AuthResponse {\n");
    sb.append("    user: ").append(toIndentedString(user)).append("\n");
    sb.append("    tokens: ").append(toIndentedString(tokens)).append("\n");
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

