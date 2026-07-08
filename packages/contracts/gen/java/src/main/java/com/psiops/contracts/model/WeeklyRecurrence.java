package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Recorrência semanal simples de uma consulta. Ausente/None indica consulta avulsa. A materialização das ocorrências (expandir em instâncias vs. manter como regra) é decisão da API (PSI-024), não deste contrato.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class WeeklyRecurrence {

  /**
   * Dia da semana da recorrência.
   */
  public enum WeekdayEnum {
    SEGUNDA("segunda"),
    
    TERCA("terca"),
    
    QUARTA("quarta"),
    
    QUINTA("quinta"),
    
    SEXTA("sexta"),
    
    SABADO("sabado"),
    
    DOMINGO("domingo");

    private final String value;

    WeekdayEnum(String value) {
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
    public static WeekdayEnum fromValue(String value) {
      for (WeekdayEnum b : WeekdayEnum.values()) {
        if (b.value.equals(value)) {
          return b;
        }
      }
      throw new IllegalArgumentException("Unexpected value '" + value + "'");
    }
  }

  private WeekdayEnum weekday;

  private Integer interval = 1;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private @Nullable LocalDate until;

  public WeeklyRecurrence() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public WeeklyRecurrence(WeekdayEnum weekday) {
    this.weekday = weekday;
  }

  public WeeklyRecurrence weekday(WeekdayEnum weekday) {
    this.weekday = weekday;
    return this;
  }

  /**
   * Dia da semana da recorrência.
   * @return weekday
   */
  @NotNull 
  @JsonProperty("weekday")
  public WeekdayEnum getWeekday() {
    return weekday;
  }

  @JsonProperty("weekday")
  public void setWeekday(WeekdayEnum weekday) {
    this.weekday = weekday;
  }

  public WeeklyRecurrence interval(Integer interval) {
    this.interval = interval;
    return this;
  }

  /**
   * Intervalo em semanas entre ocorrências (1 = toda semana, 2 = quinzenal).
   * minimum: 1
   * maximum: 8
   * @return interval
   */
  @Min(value = 1) @Max(value = 8) 
  @JsonProperty("interval")
  public Integer getInterval() {
    return interval;
  }

  @JsonProperty("interval")
  public void setInterval(Integer interval) {
    this.interval = interval;
  }

  public WeeklyRecurrence until(@Nullable LocalDate until) {
    this.until = until;
    return this;
  }

  /**
   * Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
   * @return until
   */
  @Valid 
  @JsonProperty("until")
  public @Nullable LocalDate getUntil() {
    return until;
  }

  @JsonProperty("until")
  public void setUntil(@Nullable LocalDate until) {
    this.until = until;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    WeeklyRecurrence weeklyRecurrence = (WeeklyRecurrence) o;
    return Objects.equals(this.weekday, weeklyRecurrence.weekday) &&
        Objects.equals(this.interval, weeklyRecurrence.interval) &&
        Objects.equals(this.until, weeklyRecurrence.until);
  }

  @Override
  public int hashCode() {
    return Objects.hash(weekday, interval, until);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class WeeklyRecurrence {\n");
    sb.append("    weekday: ").append(toIndentedString(weekday)).append("\n");
    sb.append("    interval: ").append(toIndentedString(interval)).append("\n");
    sb.append("    until: ").append(toIndentedString(until)).append("\n");
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

