package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.OnboardingStep;
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
 * Estado do onboarding da psicóloga: os passos concluídos e se o fluxo terminou. Orienta a UI a retomar de onde parou.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class OnboardingStatus {

  private Boolean completed;

  private List<@Valid OnboardingStep> steps = new ArrayList<>();

  public OnboardingStatus() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public OnboardingStatus(Boolean completed, List<@Valid OnboardingStep> steps) {
    this.completed = completed;
    this.steps = steps;
  }

  public OnboardingStatus completed(Boolean completed) {
    this.completed = completed;
    return this;
  }

  /**
   * Se o onboarding foi concluído.
   * @return completed
   */
  @NotNull 
  @JsonProperty("completed")
  public Boolean getCompleted() {
    return completed;
  }

  @JsonProperty("completed")
  public void setCompleted(Boolean completed) {
    this.completed = completed;
  }

  public OnboardingStatus steps(List<@Valid OnboardingStep> steps) {
    this.steps = steps;
    return this;
  }

  public OnboardingStatus addStepsItem(OnboardingStep stepsItem) {
    if (this.steps == null) {
      this.steps = new ArrayList<>();
    }
    this.steps.add(stepsItem);
    return this;
  }

  /**
   * Passos do onboarding e sua conclusão.
   * @return steps
   */
  @NotNull @Valid 
  @JsonProperty("steps")
  public List<@Valid OnboardingStep> getSteps() {
    return steps;
  }

  @JsonProperty("steps")
  public void setSteps(List<@Valid OnboardingStep> steps) {
    this.steps = steps;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    OnboardingStatus onboardingStatus = (OnboardingStatus) o;
    return Objects.equals(this.completed, onboardingStatus.completed) &&
        Objects.equals(this.steps, onboardingStatus.steps);
  }

  @Override
  public int hashCode() {
    return Objects.hash(completed, steps);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class OnboardingStatus {\n");
    sb.append("    completed: ").append(toIndentedString(completed)).append("\n");
    sb.append("    steps: ").append(toIndentedString(steps)).append("\n");
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

