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
 * Marca um passo do onboarding como concluído.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class OnboardingCompleteRequest {

  private String stepKey;

  public OnboardingCompleteRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public OnboardingCompleteRequest(String stepKey) {
    this.stepKey = stepKey;
  }

  public OnboardingCompleteRequest stepKey(String stepKey) {
    this.stepKey = stepKey;
    return this;
  }

  /**
   * Passo a marcar como concluído.
   * @return stepKey
   */
  @NotNull 
  @JsonProperty("stepKey")
  public String getStepKey() {
    return stepKey;
  }

  @JsonProperty("stepKey")
  public void setStepKey(String stepKey) {
    this.stepKey = stepKey;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    OnboardingCompleteRequest onboardingCompleteRequest = (OnboardingCompleteRequest) o;
    return Objects.equals(this.stepKey, onboardingCompleteRequest.stepKey);
  }

  @Override
  public int hashCode() {
    return Objects.hash(stepKey);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class OnboardingCompleteRequest {\n");
    sb.append("    stepKey: ").append(toIndentedString(stepKey)).append("\n");
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

