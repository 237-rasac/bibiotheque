package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.dao.RoleRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.Role;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@CrossOrigin("http://localhost:4200/")
@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/users")
    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    public Users addUserByAdmin(@RequestBody Users user) {
        // Validation défensive : le mot de passe ne doit jamais être null/blank
        // (sinon passwordEncoder.encode() lève "rawPassword cannot be null").
        if (user.getName() == null || user.getName().isBlank()
                || user.getUsername() == null || user.getUsername().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Name, username and password are required.");
        }

        // Unicité du username : sans ce contrôle, un doublon rendait le compte
        // illistable par findByUsername() et cassait le login des deux lignes.
        if (usersRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new ConflictException(
                    "Username '" + user.getUsername() + "' is already taken.",
                    "USERNAME_TAKEN");
        }

        String password = user.getPassword();
        String encryptPassword = passwordEncoder.encode(password);
        user.setPassword(encryptPassword);

        // Le rôle est attribué par le backend : tout nouvel utilisateur
        // créé via ce endpoint est un ADHERENT. Tout rôle envoyé dans le
        // corps de la requête est ignoré (et écrasé).
        Role adherentRole = roleRepository.findByRoleName("ADHERENT")
                .orElseThrow(() -> new NotFoundException("Role 'ADHERENT' does not exist."));
        user.setRole(new HashSet<>(Collections.singletonList(adherentRole)));

        usersRepository.save(user);
        return user;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    public List<Users> getAllUsers() {
        return usersRepository.findAll();
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @GetMapping("/users/{id}")
    public ResponseEntity<Users> getUserById(@PathVariable Integer id) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("User with id "+ id +" does not exist."));
        return ResponseEntity.ok(user);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @PutMapping("/users/{id}")
    public ResponseEntity<Users> updateUser(@PathVariable Integer id, @RequestBody Users userDetails) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("User with id "+ id +" does not exist."));

        // Unicité du username (en excluant l'utilisateur modifié lui-même)
        usersRepository.findByUsername(userDetails.getUsername())
                .ifPresent(existing -> {
                    if (!existing.getUserId().equals(user.getUserId())) {
                        throw new ConflictException(
                                "Username '" + userDetails.getUsername() + "' is already taken.",
                                "USERNAME_TAKEN");
                    }
                });

        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setUsername(userDetails.getUsername());

        Users updatedUser = usersRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PreAuthorize("hasRole('BIBLIOTHECAIRE')")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteUser(@PathVariable Integer id) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("User with id " + id + " does not exist."));
        usersRepository.delete(user);

        // Réponse JSON propre (cohérente avec DELETE /admin/books/{id}) :
        // une string brute déclencherait une erreur de parsing côté Angular.
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        return ResponseEntity.ok(response);
    }
}
