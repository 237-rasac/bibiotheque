package com.ibizabroker.bibliotheque.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 401 Unauthorized : le serveur ne sait pas qui est l'appelant
 * (token absent, invalide, expiré ou utilisateur introuvable).
 */
@ResponseStatus(value = HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public UnauthorizedException(String message) {
        super(message);
    }
}
