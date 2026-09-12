package com.ibizabroker.bibliotheque.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.persistence.*;
import java.util.Set;

@Data
@Entity
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer userId;

    // Unique en base (contrainte ajoutée par migration SQL) : un doublon
    // casse findByUsername() -> NonUniqueResultException -> login 401.
    @Column(unique = true)
    private String username;
    private String name;

    // Hash BCrypt : jamais exposé dans les réponses JSON de l'API,
    // mais toujours accepté en entrée (création / update d'utilisateur).
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    /**
     * Pas de cascade : les rôles sont des données de référence partagées.
     * Avec CascadeType.ALL, supprimer un utilisateur tentait de supprimer
     * les lignes de la table role, ce qui violait la FK de user_role
     * dès qu'un autre utilisateur référençait le même rôle (HTTP 500).
     * La ligne correspondante de user_role est supprimée automatiquement
     * par Hibernate lors du delete de l'utilisateur.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "USER_ROLE",
            joinColumns = {
                    @JoinColumn(name = "USER_ID")
            },
            inverseJoinColumns = {
                    @JoinColumn(name = "ROLE_ID")
            }
    )
    private Set<Role> role;

}

