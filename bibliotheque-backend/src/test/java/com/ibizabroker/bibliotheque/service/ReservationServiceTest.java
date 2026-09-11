package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.*;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.ForbiddenException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import com.ibizabroker.bibliotheque.exceptions.UnauthorizedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires de ReservationService (repository simulés, aucune base de données).
 * L'identité est injectée dans le SecurityContextHolder comme le fait
 * JwtRequestFilter en production, afin de prouver :
 * - RS-04 : l'identité vient du contexte de sécurité, jamais du corps
 * - RS-03 : isolement des réservations par adhérent
 * - RS-05 : la liste d'un ADHERENT ne contient que ses réservations
 * - RG-01..RG-06 : règles métier inchangées
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private BooksRepository booksRepository;

    @Mock
    private UsersRepository usersRepository;

    @InjectMocks
    private ReservationService reservationService;

    private Books unavailableBook;
    private Users member;      // jean, id 10 (ADHERENT connecté)
    private Users otherMember; // marie, id 20 (autre adhérent)

    @BeforeEach
    void setUp() {
        unavailableBook = new Books();
        unavailableBook.setBookId(1);
        unavailableBook.setBookName("Le Petit Prince");
        unavailableBook.setNoOfCopies(0); // unavailable

        member = new Users();
        member.setUserId(10);
        member.setUsername("jean");
        member.setName("Jean Dupont");

        otherMember = new Users();
        otherMember.setUserId(20);
        otherMember.setUsername("marie");
        otherMember.setName("Marie Martin");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Simule ce que JwtRequestFilter fait en production : pose une
     * Authentication dont le principal est le username du token JWT.
     */
    private void authenticateAs(String username, String... roles) {
        Set<SimpleGrantedAuthority> authorities = Arrays.stream(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toSet());
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, "n/a", authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void givenAuthenticatedAdherent() {
        authenticateAs("jean", "ADHERENT");
        when(usersRepository.findByUsername("jean")).thenReturn(Optional.of(member));
    }

    private ReservationRequest requestFor(Integer livreId, Integer adherentId) {
        ReservationRequest request = new ReservationRequest();
        request.setLivreId(livreId);
        request.setAdherentId(adherentId);
        return request;
    }

    private void givenCreatePathAllowed() {
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(10), eq(1), anyList())).thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(eq(10), anyList()))
                .thenReturn(0L);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setReservationId(1);
            return r;
        });
    }

    // =============================================
    // RS-04 : identité issue du token, jamais du corps
    // =============================================

    @Test
    void createReservation_shouldIgnoreAdherentIdFromBodyAndForceTokenIdentity_RS04() {
        givenAuthenticatedAdherent();
        givenCreatePathAllowed();

        // Un adhérent malveillant met l'id de quelqu'un d'autre dans le corps
        ReservationResponse response = reservationService.createReservation(requestFor(1, 20));

        // La réservation créée appartient bien à l'utilisateur du token (jean, 10)
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertEquals(10, captor.getValue().getAdherent().getUserId());
        assertEquals(10, response.getAdherentId());

        // L'autre adhérent n'est jamais consulté
        verify(usersRepository, never()).findById(20);
        verify(usersRepository, never()).findById(argThat(id -> id != null && id != 10));
    }

    @Test
    void createReservation_shouldRejectRequestWithoutAuthentication_RS01() {
        // Aucune authentication dans le SecurityContextHolder (pas de token valide)
        assertThrows(UnauthorizedException.class,
                () -> reservationService.createReservation(requestFor(1, 10)));
        verifyNoInteractions(reservationRepository);
    }

    @Test
    void createReservation_shouldFailWhenAuthenticatedUserIsUnknown() {
        authenticateAs("ghost", "ADHERENT");
        when(usersRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class,
                () -> reservationService.createReservation(requestFor(1, 10)));
    }

    // =============================================
    // RG-03 : limite de 3 réservations actives par membre
    // (repository mocké : aucune base de données requise)
    // =============================================

    @Test
    void createReservation_shouldSucceedWhenMemberHasZeroActiveReservations() {
        givenAuthenticatedAdherent();
        givenCreatePathAllowed();

        ReservationResponse response = reservationService.createReservation(requestFor(1, 10));

        assertNotNull(response);
        assertEquals(ReservationStatut.EN_ATTENTE, response.getStatut());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void createReservation_shouldSucceedWhenMemberHasTwoActiveReservations_RG03() {
        givenAuthenticatedAdherent();
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(10), eq(1), anyList())).thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(eq(10), anyList()))
                .thenReturn(2L);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setReservationId(4);
            return r;
        });

        ReservationResponse response = reservationService.createReservation(requestFor(1, 10));

        assertNotNull(response);
        assertEquals(ReservationStatut.EN_ATTENTE, response.getStatut());
    }

    @Test
    void createReservation_shouldRejectThirdActiveReservationForAdherent_RG03() {
        givenAuthenticatedAdherent();
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(10), eq(1), anyList())).thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(eq(10), anyList()))
                .thenReturn(3L);

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.createReservation(requestFor(1, 10)));

        assertEquals("RG-03", exception.getRule());
        assertTrue(exception.getMessage().contains("3 réservations actives"));
        verify(reservationRepository, never()).save(any());
    }

    // =============================================
    // RG-01 : le livre doit être indisponible
    // =============================================

    @Test
    void createReservation_shouldFailWhenBookIsAvailable_RG01() {
        givenAuthenticatedAdherent();
        Books availableBook = new Books();
        availableBook.setBookId(2);
        availableBook.setBookName("Dune");
        availableBook.setNoOfCopies(3); // available

        when(booksRepository.findById(2)).thenReturn(Optional.of(availableBook));
        // l'utilisateur courant est charge avant la regle RG-01
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.createReservation(requestFor(2, 10)));

        assertEquals("RG-01", exception.getRule());
    }

    // =============================================
    // RG-02 : pas de doublon actif pour le même livre
    // =============================================

    @Test
    void createReservation_shouldFailWhenDuplicateActiveReservationExists_RG02() {
        givenAuthenticatedAdherent();
        Reservation existing = new Reservation();
        existing.setReservationId(5);

        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(
                eq(10), eq(1), anyList())).thenReturn(List.of(existing));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.createReservation(requestFor(1, 10)));

        assertEquals("RG-02", exception.getRule());
    }

    // =============================================
    // Erreurs de validation / introuvables
    // =============================================

    @Test
    void createReservation_shouldFailWhenBookNotFound() {
        givenAuthenticatedAdherent();
        when(booksRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> reservationService.createReservation(requestFor(99, 10)));
    }

    @Test
    void createReservation_shouldFailWhenMissingLivreId() {
        givenAuthenticatedAdherent();

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(requestFor(null, 10)));
    }

    @Test
    void createReservation_shouldSetExpirationExactly7DaysAfterReservation() {
        givenAuthenticatedAdherent();
        givenCreatePathAllowed();

        ReservationResponse response = reservationService.createReservation(requestFor(1, 10));

        long diffMillis = response.getDateExpiration().getTime() - response.getDateReservation().getTime();
        long diffDays = diffMillis / (1000 * 60 * 60 * 24);
        assertEquals(7, diffDays, "Expiration date must be exactly 7 days after reservation date");
    }

    // =============================================
    // RS-05 : la liste d'un ADHERENT ne contient que ses réservations
    // =============================================

    @Test
    void listReservations_shouldReturnOnlyOwnReservationsForAdherent_RS05() {
        givenAuthenticatedAdherent();
        Reservation own = new Reservation();
        own.setReservationId(1);
        own.setLivre(unavailableBook);
        own.setAdherent(member);
        own.setStatut(ReservationStatut.EN_ATTENTE);

        when(reservationRepository.findByAdherentUserId(10)).thenReturn(List.of(own));

        List<ReservationResponse> result = reservationService.listReservations(null, null);

        assertEquals(1, result.size());
        assertEquals(10, result.get(0).getAdherentId());
        verify(reservationRepository, never()).findAll();
    }

    @Test
    void listReservations_shouldIgnoreForeignAdherentIdFilterForAdherent_RS05() {
        givenAuthenticatedAdherent();
        Reservation own = new Reservation();
        own.setReservationId(1);
        own.setLivre(unavailableBook);
        own.setAdherent(member);
        own.setStatut(ReservationStatut.EN_ATTENTE);

        // L'ADHERENT tente de lister les réservations de l'adhérent 20 :
        // le service force le filtre sur son propre identifiant (10).
        when(reservationRepository.findByAdherentUserId(10)).thenReturn(List.of(own));

        List<ReservationResponse> result = reservationService.listReservations(null, 20);

        assertEquals(1, result.size());
        assertEquals(10, result.get(0).getAdherentId());
        verify(reservationRepository, never()).findByAdherentUserId(20);
        verify(reservationRepository, never()).findByAdherentUserIdAndStatut(anyInt(), any());
        verify(reservationRepository, never()).findAll();
    }

    @Test
    void listReservations_shouldReturnAllReservationsForBibliothecaire_RS02() {
        authenticateAs("marie", "BIBLIOTHECAIRE");

        Reservation first = new Reservation();
        first.setReservationId(1);
        first.setLivre(unavailableBook);
        first.setAdherent(member);
        first.setStatut(ReservationStatut.EN_ATTENTE);

        Reservation second = new Reservation();
        second.setReservationId(2);
        second.setLivre(unavailableBook);
        second.setAdherent(otherMember);
        second.setStatut(ReservationStatut.DISPONIBLE);

        when(reservationRepository.findAll()).thenReturn(List.of(first, second));

        List<ReservationResponse> result = reservationService.listReservations(null, null);

        assertEquals(2, result.size());
        verify(reservationRepository).findAll();
    }

    @Test
    void listExpiredReservations_shouldReturnOnlyOwnExpiredReservationsForAdherent_RS05() {
        givenAuthenticatedAdherent();

        Reservation own = new Reservation();
        own.setReservationId(1);
        own.setLivre(unavailableBook);
        own.setAdherent(member);
        own.setStatut(ReservationStatut.EN_ATTENTE);

        Reservation foreign = new Reservation();
        foreign.setReservationId(2);
        foreign.setLivre(unavailableBook);
        foreign.setAdherent(otherMember);
        foreign.setStatut(ReservationStatut.EN_ATTENTE);

        when(reservationRepository.findByStatutAndDateExpirationBefore(
                eq(ReservationStatut.EN_ATTENTE), any(Date.class)))
                .thenReturn(new ArrayList<>(List.of(own, foreign)));

        List<ReservationResponse> result = reservationService.listExpiredReservations();

        assertEquals(1, result.size());
        assertEquals(10, result.get(0).getAdherentId());
    }

    // =============================================
    // GET /{id} : RS-03 (propriété) et RS-02 (bibliothécaire)
    // =============================================

    @Test
    void getReservationById_shouldReturnOwnReservation() {
        givenAuthenticatedAdherent();
        Reservation own = new Reservation();
        own.setReservationId(1);
        own.setLivre(unavailableBook);
        own.setAdherent(member);
        own.setStatut(ReservationStatut.EN_ATTENTE);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(own));

        ReservationResponse response = reservationService.getReservationById(1);

        assertEquals(1, response.getReservationId());
        assertEquals(10, response.getAdherentId());
    }

    @Test
    void getReservationById_shouldRejectReservationOfAnotherAdherent_RS03() {
        givenAuthenticatedAdherent();
        Reservation foreign = new Reservation();
        foreign.setReservationId(5);
        foreign.setLivre(unavailableBook);
        foreign.setAdherent(otherMember);
        foreign.setStatut(ReservationStatut.EN_ATTENTE);

        when(reservationRepository.findById(5)).thenReturn(Optional.of(foreign));

        ForbiddenException exception = assertThrows(ForbiddenException.class,
                () -> reservationService.getReservationById(5));

        assertTrue(exception.getMessage().contains("n'appartient pas"));
    }

    @Test
    void getReservationById_shouldAllowBibliothecaireToViewAnyReservation_RS02() {
        authenticateAs("marie", "BIBLIOTHECAIRE");
        when(usersRepository.findByUsername("marie"))
                .thenReturn(Optional.of(new Users() {{ setUserId(1); setUsername("marie"); }}));

        Reservation foreign = new Reservation();
        foreign.setReservationId(5);
        foreign.setLivre(unavailableBook);
        foreign.setAdherent(otherMember);
        foreign.setStatut(ReservationStatut.EN_ATTENTE);

        when(reservationRepository.findById(5)).thenReturn(Optional.of(foreign));

        ReservationResponse response = reservationService.getReservationById(5);

        assertEquals(20, response.getAdherentId());
    }

    // =============================================
    // PATCH /{id}/annuler : RG-05 / RG-06 + RS-03
    // =============================================

    @Test
    void cancelReservation_shouldSucceedForEnAttente() {
        givenAuthenticatedAdherent();
        Reservation reservation = new Reservation();
        reservation.setReservationId(1);
        reservation.setStatut(ReservationStatut.EN_ATTENTE);
        reservation.setLivre(unavailableBook);
        reservation.setAdherent(member);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.cancelReservation(1);
        assertEquals(ReservationStatut.ANNULEE, response.getStatut());
    }

    @Test
    void cancelReservation_shouldSucceedForDisponible() {
        givenAuthenticatedAdherent();
        Reservation reservation = new Reservation();
        reservation.setReservationId(2);
        reservation.setStatut(ReservationStatut.DISPONIBLE);
        reservation.setLivre(unavailableBook);
        reservation.setAdherent(member);

        when(reservationRepository.findById(2)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.cancelReservation(2);
        assertEquals(ReservationStatut.ANNULEE, response.getStatut());
    }

    @Test
    void cancelReservation_shouldFailForAnnulee_RG05() {
        givenAuthenticatedAdherent();
        Reservation reservation = new Reservation();
        reservation.setReservationId(3);
        reservation.setStatut(ReservationStatut.ANNULEE);
        reservation.setLivre(unavailableBook);
        reservation.setAdherent(member);

        when(reservationRepository.findById(3)).thenReturn(Optional.of(reservation));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.cancelReservation(3));

        assertEquals("RG-05", exception.getRule());
    }

    @Test
    void cancelReservation_shouldFailForExpiree_RG05() {
        givenAuthenticatedAdherent();
        Reservation reservation = new Reservation();
        reservation.setReservationId(4);
        reservation.setStatut(ReservationStatut.EXPIREE);
        reservation.setLivre(unavailableBook);
        reservation.setAdherent(member);

        when(reservationRepository.findById(4)).thenReturn(Optional.of(reservation));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.cancelReservation(4));

        assertEquals("RG-05", exception.getRule());
    }

    @Test
    void cancelReservation_shouldFailForHonoree_RG05() {
        givenAuthenticatedAdherent();
        Reservation reservation = new Reservation();
        reservation.setReservationId(5);
        reservation.setStatut(ReservationStatut.HONOREE);
        reservation.setLivre(unavailableBook);
        reservation.setAdherent(member);

        when(reservationRepository.findById(5)).thenReturn(Optional.of(reservation));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.cancelReservation(5));

        assertEquals("RG-05", exception.getRule());
    }

    @Test
    void cancelReservation_shouldRejectReservationOfAnotherAdherent_RS03() {
        givenAuthenticatedAdherent();
        Reservation foreign = new Reservation();
        foreign.setReservationId(6);
        foreign.setStatut(ReservationStatut.EN_ATTENTE);
        foreign.setLivre(unavailableBook);
        foreign.setAdherent(otherMember);

        when(reservationRepository.findById(6)).thenReturn(Optional.of(foreign));

        assertThrows(ForbiddenException.class,
                () -> reservationService.cancelReservation(6));
        // Statut inchangé : la réservation de l'autre n'est jamais modifiée
        assertEquals(ReservationStatut.EN_ATTENTE, foreign.getStatut());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void cancelReservation_shouldAllowBibliothecaireToCancelAnyReservation_RS02() {
        authenticateAs("marie", "BIBLIOTHECAIRE");
        when(usersRepository.findByUsername("marie"))
                .thenReturn(Optional.of(new Users() {{ setUserId(1); setUsername("marie"); }}));

        Reservation foreign = new Reservation();
        foreign.setReservationId(6);
        foreign.setStatut(ReservationStatut.EN_ATTENTE);
        foreign.setLivre(unavailableBook);
        foreign.setAdherent(otherMember);

        when(reservationRepository.findById(6)).thenReturn(Optional.of(foreign));
        when(reservationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = reservationService.cancelReservation(6);
        assertEquals(ReservationStatut.ANNULEE, response.getStatut());
    }

    // =============================================
    // DELETE /{id} : réservé au bibliothécaire via URL + @PreAuthorize
    // (testé au niveau intégration), la couche service garde son comportement
    // =============================================

    @Test
    void deleteReservation_shouldDeleteWhenExists() {
        Reservation reservation = new Reservation();
        reservation.setReservationId(1);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(reservation));

        assertDoesNotThrow(() -> reservationService.deleteReservation(1));
        verify(reservationRepository).delete(reservation);
    }

    @Test
    void deleteReservation_shouldThrowWhenNotFound() {
        when(reservationRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> reservationService.deleteReservation(99));
    }
}
