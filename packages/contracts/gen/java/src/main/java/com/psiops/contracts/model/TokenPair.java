package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Par de tokens emitido no registro, login e refresh. O access token é um JWT de curta duração enviado em &#x60;Authorization: Bearer &lt;token&gt;&#x60;; o refresh token é opaco, de uso único (rotacionado a cada refresh).
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class TokenPair {

  /**
   * Tipo do token, sempre `Bearer`.
   */
  public enum TokenTypeEnum {
    BEARER("Bearer");

    private final String value;

    TokenTypeEnum(String value) {
      this.value = value;
    }

    @JsonValue
    public String getValue() {
      return value;
    }

    @Override
    public String toString() {
      return String.valueOf(value);
    }

    @JsonCreator
    public static TokenTypeEnum fromValue(String value) {
      for (TokenTypeEnum b : TokenTypeEnum.values()) {
        if (b.value.equals(value)) {
          return b;
        }
      }
      throw new IllegalArgumentException("Unexpected value '" + value + "'");
    }
  }

  private TokenTypeEnum tokenType;

  private String accessToken;

  private Integer expiresIn;

  private String refreshToken;

  public TokenPair() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public TokenPair(TokenTypeEnum tokenType, String accessToken, Integer expiresIn, String refreshToken) {
    this.tokenType = tokenType;
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.refreshToken = refreshToken;
  }

  public TokenPair tokenType(TokenTypeEnum tokenType) {
    this.tokenType = tokenType;
    return this;
  }

  /**
   * Tipo do token, sempre `Bearer`.
   * @return tokenType
   */
  @NotNull 
  @JsonProperty("tokenType")
  public TokenTypeEnum getTokenType() {
    return tokenType;
  }

  @JsonProperty("tokenType")
  public void setTokenType(TokenTypeEnum tokenType) {
    this.tokenType = tokenType;
  }

  public TokenPair accessToken(String accessToken) {
    this.accessToken = accessToken;
    return this;
  }

  /**
   * JWT de acesso, de curta duração.
   * @return accessToken
   */
  @NotNull @Size(min = 1) 
  @JsonProperty("accessToken")
  public String getAccessToken() {
    return accessToken;
  }

  @JsonProperty("accessToken")
  public void setAccessToken(String accessToken) {
    this.accessToken = accessToken;
  }

  public TokenPair expiresIn(Integer expiresIn) {
    this.expiresIn = expiresIn;
    return this;
  }

  /**
   * Segundos até a expiração do access token, contados da emissão.
   * minimum: 1
   * @return expiresIn
   */
  @NotNull @Min(value = 1) 
  @JsonProperty("expiresIn")
  public Integer getExpiresIn() {
    return expiresIn;
  }

  @JsonProperty("expiresIn")
  public void setExpiresIn(Integer expiresIn) {
    this.expiresIn = expiresIn;
  }

  public TokenPair refreshToken(String refreshToken) {
    this.refreshToken = refreshToken;
    return this;
  }

  /**
   * Refresh token opaco para obter um novo par via /auth/refresh.
   * @return refreshToken
   */
  @NotNull @Size(min = 1) 
  @JsonProperty("refreshToken")
  public String getRefreshToken() {
    return refreshToken;
  }

  @JsonProperty("refreshToken")
  public void setRefreshToken(String refreshToken) {
    this.refreshToken = refreshToken;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    TokenPair tokenPair = (TokenPair) o;
    return Objects.equals(this.tokenType, tokenPair.tokenType) &&
        Objects.equals(this.accessToken, tokenPair.accessToken) &&
        Objects.equals(this.expiresIn, tokenPair.expiresIn) &&
        Objects.equals(this.refreshToken, tokenPair.refreshToken);
  }

  @Override
  public int hashCode() {
    return Objects.hash(tokenType, accessToken, expiresIn, refreshToken);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class TokenPair {\n");
    sb.append("    tokenType: ").append(toIndentedString(tokenType)).append("\n");
    sb.append("    accessToken: ").append(toIndentedString(accessToken)).append("\n");
    sb.append("    expiresIn: ").append(toIndentedString(expiresIn)).append("\n");
    sb.append("    refreshToken: ").append(toIndentedString(refreshToken)).append("\n");
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

