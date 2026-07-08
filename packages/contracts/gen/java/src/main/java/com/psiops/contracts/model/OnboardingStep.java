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
 * OnboardingStep
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class OnboardingStep {

  private String key;

  private Boolean done;

  public OnboardingStep() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public OnboardingStep(String key, Boolean done) {
    this.key = key;
    this.done = done;
  }

  public OnboardingStep key(String key) {
    this.key = key;
    return this;
  }

  /**
   * Identificador do passo (ex.: `perfil`, `primeiro-paciente`).
   * @return key
   */
  @NotNull 
  @JsonProperty("key")
  public String getKey() {
    return key;
  }

  @JsonProperty("key")
  public void setKey(String key) {
    this.key = key;
  }

  public OnboardingStep done(Boolean done) {
    this.done = done;
    return this;
  }

  /**
   * Get done
   * @return done
   */
  @NotNull 
  @JsonProperty("done")
  public Boolean getDone() {
    return done;
  }

  @JsonProperty("done")
  public void setDone(Boolean done) {
    this.done = done;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    OnboardingStep onboardingStep = (OnboardingStep) o;
    return Objects.equals(this.key, onboardingStep.key) &&
        Objects.equals(this.done, onboardingStep.done);
  }

  @Override
  public int hashCode() {
    return Objects.hash(key, done);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class OnboardingStep {\n");
    sb.append("    key: ").append(toIndentedString(key)).append("\n");
    sb.append("    done: ").append(toIndentedString(done)).append("\n");
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

