package com.ibizabroker.bibliotheque.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

public class JwtResponse {

    private Users user;

    // Rôles (ex: ["ROLE_ADHERENT"]) envoyés en clair au frontend,
    // qui les utilise pour l'affichage et la redirection post-login.
    private List<String> roles;

    @JsonIgnore
    private String jwtToken;

    public JwtResponse(Users user, String jwtToken) {
        this.user = user;
        this.jwtToken = jwtToken;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public String getJwtToken() {
        return jwtToken;
    }

    public void setJwtToken(String jwtToken) {
        this.jwtToken = jwtToken;
    }
}
