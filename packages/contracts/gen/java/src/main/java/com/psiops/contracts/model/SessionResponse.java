package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.RegisterUser201ResponseUser;
import java.time.OffsetDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Sessão corrente derivada do access token apresentado.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class SessionResponse implements Serializable {

  private static final long serialVersionUID = 1L;

  private RegisterUser201ResponseUser user;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime expiresAt;

  public SessionResponse() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public SessionResponse(RegisterUser201ResponseUser user, OffsetDateTime expiresAt) {
    this.user = user;
    this.expiresAt = expiresAt;
  }

  public SessionResponse user(RegisterUser201ResponseUser user) {
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

  public SessionResponse expiresAt(OffsetDateTime expiresAt) {
    this.expiresAt = expiresAt;
    return this;
  }

  /**
   * Instante de expiração do access token corrente (ISO 8601, UTC).
   * @return expiresAt
   */
  @NotNull @Valid 
  @JsonProperty("expiresAt")
  public OffsetDateTime getExpiresAt() {
    return expiresAt;
  }

  @JsonProperty("expiresAt")
  public void setExpiresAt(OffsetDateTime expiresAt) {
    this.expiresAt = expiresAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    SessionResponse sessionResponse = (SessionResponse) o;
    return Objects.equals(this.user, sessionResponse.user) &&
        Objects.equals(this.expiresAt, sessionResponse.expiresAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(user, expiresAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class SessionResponse {\n");
    sb.append("    user: ").append(toIndentedString(user)).append("\n");
    sb.append("    expiresAt: ").append(toIndentedString(expiresAt)).append("\n");
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

