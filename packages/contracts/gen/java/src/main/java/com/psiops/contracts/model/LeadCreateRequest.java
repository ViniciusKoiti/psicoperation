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
 * Payload de entrada na lista de espera, capturado pelo formulário da landing page (âncora #lista).
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class LeadCreateRequest {

  private String name;

  private String whatsapp;

  private String email;

  public LeadCreateRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public LeadCreateRequest(String name, String whatsapp, String email) {
    this.name = name;
    this.whatsapp = whatsapp;
    this.email = email;
  }

  public LeadCreateRequest name(String name) {
    this.name = name;
    return this;
  }

  /**
   * Nome informado no formulário.
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

  public LeadCreateRequest whatsapp(String whatsapp) {
    this.whatsapp = whatsapp;
    return this;
  }

  /**
   * Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
   * @return whatsapp
   */
  @NotNull @Pattern(regexp = "^\\+55[1-9][1-9]9[0-9]{8}$") @Size(min = 14, max = 14) 
  @JsonProperty("whatsapp")
  public String getWhatsapp() {
    return whatsapp;
  }

  @JsonProperty("whatsapp")
  public void setWhatsapp(String whatsapp) {
    this.whatsapp = whatsapp;
  }

  public LeadCreateRequest email(String email) {
    this.email = email;
    return this;
  }

  /**
   * E-mail de contato (único na lista de espera).
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

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    LeadCreateRequest leadCreateRequest = (LeadCreateRequest) o;
    return Objects.equals(this.name, leadCreateRequest.name) &&
        Objects.equals(this.whatsapp, leadCreateRequest.whatsapp) &&
        Objects.equals(this.email, leadCreateRequest.email);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, whatsapp, email);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class LeadCreateRequest {\n");
    sb.append("    name: ").append(toIndentedString(name)).append("\n");
    sb.append("    whatsapp: ").append(toIndentedString(whatsapp)).append("\n");
    sb.append("    email: ").append(toIndentedString(email)).append("\n");
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

