package com.psiops.api.auth.application;

import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.contracts.model.User;

/**
 * Converte {@link UserEntity} (persistência, inclui {@code passwordHash}) no
 * DTO de contrato {@link User} (nunca inclui a senha ou o hash — ver
 * schema {@code User} em {@code components/auth/schemas.yaml}).
 */
public final class UserMapper {

  private UserMapper() {
  }

  public static User toContract(UserEntity entity) {
    return new User(entity.getId(), entity.getName(), entity.getEmail(), entity.getCreatedAt());
  }
}
