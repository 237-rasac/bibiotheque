package com.ibizabroker.bibliotheque.util;

import org.springframework.http.ResponseCookie;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

/**
 * Utilitaires pour le stockage du JWT dans un cookie httpOnly :
 * inaccessible en JavaScript, donc protégé contre le vol par XSS
 * (contrairement à localStorage).
 */
public final class JwtCookieUtil {

    public static final String JWT_COOKIE_NAME = "jwtToken";

    private JwtCookieUtil() {
    }

    /**
     * Construit le cookie httpOnly contenant le JWT.
     * SameSite=Lax réduit le risque CSRF tout en restant compatible
     * avec le frontend Angular servi sur une origine différente (localhost:4200).
     */
    public static ResponseCookie createJwtCookie(String jwtToken, boolean secure) {
        return ResponseCookie.from(JWT_COOKIE_NAME, jwtToken)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(3600 * 5) // même durée de vie que le token JWT
                .sameSite("Lax")
                .build();
    }

    /** Construit le cookie d'effacement (maxAge = 0). */
    public static ResponseCookie createClearJwtCookie() {
        return ResponseCookie.from(JWT_COOKIE_NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();
    }

    /** Extrait le JWT du cookie httpOnly, ou null si absent. */
    public static String extractJwtFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (JWT_COOKIE_NAME.equals(cookie.getName())) {
                String value = cookie.getValue();
                return (value == null || value.isEmpty()) ? null : value;
            }
        }
        return null;
    }
}
