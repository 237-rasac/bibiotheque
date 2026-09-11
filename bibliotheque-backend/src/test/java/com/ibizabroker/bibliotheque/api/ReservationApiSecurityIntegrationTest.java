package com.ibizabroker.bibliotheque.api;

import com.ibizabroker.bibliotheque.entity.Books;
import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import com.ibizabroker.bibliotheque.entity.Role;
import com.ibizabroker.bibliotheque.entity.Users;
import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.RoleRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.util.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test d'intégration de la sécurité sur GET /api/reservations :
 * - sans token                      -> 401 (RS-01)
 * - avec un token ADHERENT          -> 200, ses réservations seulement (RS-05)
 * - ADHERENT sur réservation d'un autre -> 403 (RS-03)
 * - ADHERENT sur DELETE             -> 403, BIBLIOTHECAIRE -> 204 (RS-02)
 *
 * Contexte Spring complet chargé sur base H2 en mémoire :
 * aucune base externe n'est requise pour exécuter les tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReservationApiSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BooksRepository booksRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    private Users adherentJean;
    private Users adherentMarie;
    private Reservation reservationOfJean;
    private Reservation reservationOfMarie;

    @BeforeEach
    void setUpData() {
        adherentJean = createUser("jean", "Jean Dupont", "ADHERENT");
        adherentMarie = createUser("marie", "Marie Martin", "ADHERENT");

        Books book = new Books();
        book.setBookName("Le Petit Prince");
        book.setBookAuthor("Antoine de Saint-Exupéry");
        book.setBookGenre("Conte");
        book.setNoOfCopies(0);
        book = booksRepository.save(book);

        reservationOfJean = createReservation(book, adherentJean, ReservationStatut.EN_ATTENTE);
        reservationOfMarie = createReservation(book, adherentMarie, ReservationStatut.EN_ATTENTE);
    }

    @AfterEach
    void tearDown() {
        reservationRepository.deleteAll();
        booksRepository.deleteAll();
        usersRepository.deleteAll();
    }

    private Users createUser(String username, String name, String roleName) {
        Role role = roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setRoleName(roleName);
                    return roleRepository.save(r);
                });
        Users user = new Users();
        user.setUsername(username);
        user.setName(name);
        user.setPassword("n/a");
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRole(roles);
        return usersRepository.save(user);
    }

    private Reservation createReservation(Books book, Users adherent, ReservationStatut statut) {
        Reservation reservation = new Reservation();
        reservation.setLivre(book);
        reservation.setAdherent(adherent);
        reservation.setDateReservation(new Date());
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DATE, 7);
        reservation.setDateExpiration(cal.getTime());
        reservation.setStatut(statut);
        return reservationRepository.save(reservation);
    }

    /**
     * Génère un vrai JWT signé (même mécanisme que POST /authenticate).
     */
    private String tokenFor(Users user, String roleName) {
        UserDetails userDetails = User.builder()
                .username(user.getUsername())
                .password("n/a")
                .roles(roleName)
                .build();
        return jwtUtil.generateToken(userDetails);
    }

    // RS-01 : sans token, tout endpoint de réservation renvoie 401
    @Test
    void listReservations_withoutToken_shouldReturn401_RS01() throws Exception {
        mockMvc.perform(get("/api/reservations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getReservationById_withoutToken_shouldReturn401_RS01() throws Exception {
        mockMvc.perform(get("/api/reservations/" + reservationOfJean.getReservationId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cancelReservation_withoutToken_shouldReturn401_RS01() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/reservations/" + reservationOfJean.getReservationId() + "/annuler"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteReservation_withoutToken_shouldReturn401_RS01() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/reservations/" + reservationOfJean.getReservationId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createReservation_withoutToken_shouldReturn401_RS01() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/reservations")
                        .contentType("application/json")
                        .content("{\"livreId\": 1, \"adherentId\": 1}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listReservations_withExpiredOrInvalidToken_shouldReturn401_RS01() throws Exception {
        mockMvc.perform(get("/api/reservations")
                        .header("Authorization", "Bearer token.invalide.signe"))
                .andExpect(status().isUnauthorized());
    }

    // RS-05 : avec un token ADHERENT -> 200 et uniquement ses réservations
    @Test
    void listReservations_withAdherentToken_shouldReturn200AndOnlyHisReservations_RS05() throws Exception {
        String token = tokenFor(adherentJean, "ADHERENT");

        mockMvc.perform(get("/api/reservations")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reservationId").value(reservationOfJean.getReservationId()))
                .andExpect(jsonPath("$[0].adherentId").value(adherentJean.getUserId()));
    }

    // RS-03 : un ADHERENT qui accède à la réservation d'un autre reçoit 403
    @Test
    void getReservationById_withAdherentTokenOnForeignReservation_shouldReturn403_RS03() throws Exception {
        String token = tokenFor(adherentJean, "ADHERENT");

        mockMvc.perform(get("/api/reservations/" + reservationOfMarie.getReservationId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelReservation_withAdherentTokenOnForeignReservation_shouldReturn403_RS03() throws Exception {
        String token = tokenFor(adherentJean, "ADHERENT");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/reservations/" + reservationOfMarie.getReservationId() + "/annuler")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // RS-04 : le corps de la requête ne peut pas désigner un autre adhérent
    @Test
    void createReservation_withAdherentTokenForgingAdherentId_shouldCreateForTokenUser_RS04() throws Exception {
        // Un livre indisponible sans réservation existante (RG-01/RG-02 satisfaites)
        Books freshBook = new Books();
        freshBook.setBookName("Dune");
        freshBook.setBookAuthor("Frank Herbert");
        freshBook.setBookGenre("SF");
        freshBook.setNoOfCopies(0);
        freshBook = booksRepository.save(freshBook);

        String token = tokenFor(adherentJean, "ADHERENT");

        // jean envoie l'id de marie dans le corps : le serveur doit l'ignorer
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/reservations")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"livreId\": " + freshBook.getBookId()
                                + ", \"adherentId\": " + adherentMarie.getUserId() + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.adherentId").value(adherentJean.getUserId()))
                .andExpect(jsonPath("$.adherentName").value("Jean Dupont"));
    }

    // RS-02 : un ADHERENT qui tente une action de bibliothécaire reçoit 403
    @Test
    void deleteReservation_withAdherentToken_shouldReturn403_RS02() throws Exception {
        String token = tokenFor(adherentJean, "ADHERENT");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/reservations/" + reservationOfJean.getReservationId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteReservation_withBibliothecaireToken_shouldReturn204_RS02() throws Exception {
        Users biblio = createUser("biblio", "Bibi Biblio", "BIBLIOTHECAIRE");
        String token = tokenFor(biblio, "BIBLIOTHECAIRE");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/reservations/" + reservationOfJean.getReservationId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void getReservationById_withBibliothecaireTokenOnForeignReservation_shouldReturn200_RS02() throws Exception {
        Users biblio = createUser("biblio", "Bibi Biblio", "BIBLIOTHECAIRE");
        String token = tokenFor(biblio, "BIBLIOTHECAIRE");

        mockMvc.perform(get("/api/reservations/" + reservationOfMarie.getReservationId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adherentId").value(adherentMarie.getUserId()));
    }

    @Test
    void listReservations_withAdherentTokenForcingForeignAdherentIdFilter_shouldReturnOnlyOwn_RS05() throws Exception {
        String token = tokenFor(adherentJean, "ADHERENT");

        // jean essaie de lister les réservations de marie via le filtre : ignoré
        mockMvc.perform(get("/api/reservations")
                        .param("adherentId", String.valueOf(adherentMarie.getUserId()))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].adherentId").value(adherentJean.getUserId()));
    }
}
