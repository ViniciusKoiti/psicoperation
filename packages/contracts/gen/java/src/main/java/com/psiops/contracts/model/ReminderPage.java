package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.psiops.contracts.model.PageMeta;
import com.psiops.contracts.model.Reminder;
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
 * Página de lembretes.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class ReminderPage {

  private List<@Valid Reminder> items = new ArrayList<>();

  private PageMeta meta;

  public ReminderPage() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public ReminderPage(List<@Valid Reminder> items, PageMeta meta) {
    this.items = items;
    this.meta = meta;
  }

  public ReminderPage items(List<@Valid Reminder> items) {
    this.items = items;
    return this;
  }

  public ReminderPage addItemsItem(Reminder itemsItem) {
    if (this.items == null) {
      this.items = new ArrayList<>();
    }
    this.items.add(itemsItem);
    return this;
  }

  /**
   * Get items
   * @return items
   */
  @NotNull @Valid 
  @JsonProperty("items")
  public List<@Valid Reminder> getItems() {
    return items;
  }

  @JsonProperty("items")
  public void setItems(List<@Valid Reminder> items) {
    this.items = items;
  }

  public ReminderPage meta(PageMeta meta) {
    this.meta = meta;
    return this;
  }

  /**
   * Get meta
   * @return meta
   */
  @NotNull @Valid 
  @JsonProperty("meta")
  public PageMeta getMeta() {
    return meta;
  }

  @JsonProperty("meta")
  public void setMeta(PageMeta meta) {
    this.meta = meta;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ReminderPage reminderPage = (ReminderPage) o;
    return Objects.equals(this.items, reminderPage.items) &&
        Objects.equals(this.meta, reminderPage.meta);
  }

  @Override
  public int hashCode() {
    return Objects.hash(items, meta);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ReminderPage {\n");
    sb.append("    items: ").append(toIndentedString(items)).append("\n");
    sb.append("    meta: ").append(toIndentedString(meta)).append("\n");
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

