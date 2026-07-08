package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Tarefa administrativa (lembrete interno de afazer).
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class Task {

  private UUID id;

  private String title;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private @Nullable LocalDate dueDate;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime completedAt;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime createdAt;

  public Task() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public Task(UUID id, String title, OffsetDateTime createdAt) {
    this.id = id;
    this.title = title;
    this.createdAt = createdAt;
  }

  public Task id(UUID id) {
    this.id = id;
    return this;
  }

  /**
   * Get id
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

  public Task title(String title) {
    this.title = title;
    return this;
  }

  /**
   * Descrição curta da tarefa.
   * @return title
   */
  @NotNull @Size(min = 1, max = 200) 
  @JsonProperty("title")
  public String getTitle() {
    return title;
  }

  @JsonProperty("title")
  public void setTitle(String title) {
    this.title = title;
  }

  public Task dueDate(@Nullable LocalDate dueDate) {
    this.dueDate = dueDate;
    return this;
  }

  /**
   * Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
   * @return dueDate
   */
  @Valid 
  @JsonProperty("dueDate")
  public @Nullable LocalDate getDueDate() {
    return dueDate;
  }

  @JsonProperty("dueDate")
  public void setDueDate(@Nullable LocalDate dueDate) {
    this.dueDate = dueDate;
  }

  public Task completedAt(@Nullable OffsetDateTime completedAt) {
    this.completedAt = completedAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return completedAt
   */
  @Valid 
  @JsonProperty("completedAt")
  public @Nullable OffsetDateTime getCompletedAt() {
    return completedAt;
  }

  @JsonProperty("completedAt")
  public void setCompletedAt(@Nullable OffsetDateTime completedAt) {
    this.completedAt = completedAt;
  }

  public Task createdAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
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
    Task task = (Task) o;
    return Objects.equals(this.id, task.id) &&
        Objects.equals(this.title, task.title) &&
        Objects.equals(this.dueDate, task.dueDate) &&
        Objects.equals(this.completedAt, task.completedAt) &&
        Objects.equals(this.createdAt, task.createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, title, dueDate, completedAt, createdAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Task {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    title: ").append(toIndentedString(title)).append("\n");
    sb.append("    dueDate: ").append(toIndentedString(dueDate)).append("\n");
    sb.append("    completedAt: ").append(toIndentedString(completedAt)).append("\n");
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

