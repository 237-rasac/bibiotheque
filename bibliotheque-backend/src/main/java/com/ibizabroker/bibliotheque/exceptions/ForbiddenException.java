package com.ibizabroker.bibliotheque.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 403 Forbidden : l'utilisateur est authentifié (on sait qui il est)
 * mais il n'a pas les droits requis (RS-02, RS-03, RS-04).
 * Ne jamais l'utiliser pour un utilisateur non authentifié (401 à la place).
 */
@ResponseStatus(value = HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ForbiddenException(String message) {
        super(message);
    }
}
