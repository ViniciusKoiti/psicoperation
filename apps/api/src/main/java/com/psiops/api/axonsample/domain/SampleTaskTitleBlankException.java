package com.psiops.api.axonsample.domain;

/**
 * Rejeição de comando: título em branco não é uma tarefa exemplo válida.
 * Lançada pelo {@code @CommandHandler} de criação, antes de qualquer evento
 * ser aplicado — o {@code CommandGateway} propaga a exceção ao chamador.
 */
public class SampleTaskTitleBlankException extends RuntimeException {

  public SampleTaskTitleBlankException() {
    super("título da tarefa exemplo não pode ser vazio");
  }
}
