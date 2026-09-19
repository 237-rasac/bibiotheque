package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.entity.JwtRequest;
import com.ibizabroker.bibliotheque.entity.JwtResponse;
import com.ibizabroker.bibliotheque.service.JwtService;
import com.ibizabroker.bibliotheque.util.JwtCookieUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
//@RequestMapping("/")
public class JwtController {

    @Autowired
    private JwtService jwtService;

    /**
     * Authentifie l'utilisateur et pose le JWT dans un cookie httpOnly.
     * Le token n'est plus renvoyé dans le body de la réponse (XSS-safe).
     */
    @PostMapping("/authenticate")
    public ResponseEntity<JwtResponse> createJwtToken(@RequestBody JwtRequest jwtRequest) throws Exception {
        JwtResponse jwtResponse = jwtService.createJwtToken(jwtRequest);

        ResponseCookie cookie = JwtCookieUtil.createJwtCookie(
                jwtResponse.getJwtToken(),
                false // secure=false en dev HTTP; mettre true derrière HTTPS en prod
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(jwtResponse);
    }

    /**
     * Déconnexion serveur : écrase le cookie JWT (maxAge=0).
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie clearCookie = JwtCookieUtil.createClearJwtCookie();
        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }
}