package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.*;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
    private Users member;

    @BeforeEach
    void setUp() {
        unavailableBook = new Books();
        unavailableBook.setBookId(1);
        unavailableBook.setBookName("Le Petit Prince");
        unavailableBook.setNoOfCopies(0); // unavailable

        member = new Users();
        member.setUserId(10);
        member.setName("Jean Dupont");
    }

    // =============================================
    // RG-03: Max 3 active reservations per member
    // =============================================

    @Test
    void createReservation_shouldSucceedWhenMemberHasZeroActiveReservations() {
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(10, 1, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(10, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(0L);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setReservationId(1);
            return r;
        });

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);
        request.setAdherentId(10);

        ReservationResponse response = reservationService.createReservation(request);

        assertNotNull(response);
        assertEquals(ReservationStatut.EN_ATTENTE, response.getStatut());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void createReservation_shouldSucceedWhenMemberHasTwoActiveReservations() {
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(10, 1, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(10, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(2L);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setReservationId(4);
            return r;
        });

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);
        request.setAdherentId(10);

        ReservationResponse response = reservationService.createReservation(request);

        assertNotNull(response);
        assertEquals(ReservationStatut.EN_ATTENTE, response.getStatut());
    }

    @Test
    void createReservation_shouldFailWhenMemberHasThreeActiveReservations_RG03() {
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(10, 1, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(10, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(3L);

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);
        request.setAdherentId(10);

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.createReservation(request));

        assertEquals("RG-03", exception.getRule());
        assertTrue(exception.getMessage().contains("3 réservations actives"));
        verify(reservationRepository, never()).save(any());
    }

    // =============================================
    // RG-01: Book must be unavailable
    // =============================================

    @Test
    void createReservation_shouldFailWhenBookIsAvailable_RG01() {
        Books availableBook = new Books();
        availableBook.setBookId(2);
        availableBook.setBookName("Dune");
        availableBook.setNoOfCopies(3); // available

        when(booksRepository.findById(2)).thenReturn(Optional.of(availableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(2);
        request.setAdherentId(10);

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.createReservation(request));

        assertEquals("RG-01", exception.getRule());
    }

    // =============================================
    // RG-02: No duplicate active reservation for same book
    // =============================================

    @Test
    void createReservation_shouldFailWhenDuplicateActiveReservationExists_RG02() {
        Reservation existing = new Reservation();
        existing.setReservationId(5);

        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(10, 1, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(List.of(existing));

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);
        request.setAdherentId(10);

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.createReservation(request));

        assertEquals("RG-02", exception.getRule());
    }

    // =============================================
    // RG-05: Cancel only EN_ATTENTE or DISPONIBLE
    // =============================================

    @Test
    void cancelReservation_shouldSucceedForEnAttente() {
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
        Reservation reservation = new Reservation();
        reservation.setReservationId(3);
        reservation.setStatut(ReservationStatut.ANNULEE);

        when(reservationRepository.findById(3)).thenReturn(Optional.of(reservation));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.cancelReservation(3));

        assertEquals("RG-05", exception.getRule());
    }

    // =============================================
    // RG-06: Terminal statuses cannot change
    // =============================================

    @Test
    void cancelReservation_shouldFailForExpiree_RG05() {
        Reservation reservation = new Reservation();
        reservation.setReservationId(4);
        reservation.setStatut(ReservationStatut.EXPIREE);

        when(reservationRepository.findById(4)).thenReturn(Optional.of(reservation));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.cancelReservation(4));

        assertEquals("RG-05", exception.getRule());
    }

    @Test
    void cancelReservation_shouldFailForHonoree_RG05() {
        Reservation reservation = new Reservation();
        reservation.setReservationId(5);
        reservation.setStatut(ReservationStatut.HONOREE);

        when(reservationRepository.findById(5)).thenReturn(Optional.of(reservation));

        ConflictException exception = assertThrows(ConflictException.class,
                () -> reservationService.cancelReservation(5));

        assertEquals("RG-05", exception.getRule());
    }

    // =============================================
    // Not found cases
    // =============================================

    @Test
    void createReservation_shouldFailWhenBookNotFound() {
        when(booksRepository.findById(99)).thenReturn(Optional.empty());

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(99);
        request.setAdherentId(10);

        assertThrows(NotFoundException.class,
                () -> reservationService.createReservation(request));
    }

    @Test
    void createReservation_shouldFailWhenUserNotFound() {
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(99)).thenReturn(Optional.empty());

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);
        request.setAdherentId(99);

        assertThrows(NotFoundException.class,
                () -> reservationService.createReservation(request));
    }

    @Test
    void createReservation_shouldFailWhenMissingLivreId() {
        ReservationRequest request = new ReservationRequest();
        request.setAdherentId(10);

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(request));
    }

    @Test
    void createReservation_shouldFailWhenMissingAdherentId() {
        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);

        assertThrows(IllegalArgumentException.class,
                () -> reservationService.createReservation(request));
    }

    // =============================================
    // RG-04: Expiration date is exactly 7 days
    // =============================================

    @Test
    void createReservation_shouldSetExpirationExactly7DaysAfterReservation() {
        when(booksRepository.findById(1)).thenReturn(Optional.of(unavailableBook));
        when(usersRepository.findById(10)).thenReturn(Optional.of(member));
        when(reservationRepository.findByAdherentUserIdAndLivreBookIdAndStatutIn(10, 1, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(List.of());
        when(reservationRepository.countByAdherentUserIdAndStatutIn(10, List.of(ReservationStatut.EN_ATTENTE, ReservationStatut.DISPONIBLE)))
                .thenReturn(0L);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setReservationId(1);
            return r;
        });

        ReservationRequest request = new ReservationRequest();
        request.setLivreId(1);
        request.setAdherentId(10);

        ReservationResponse response = reservationService.createReservation(request);

        long diffMillis = response.getDateExpiration().getTime() - response.getDateReservation().getTime();
        long diffDays = diffMillis / (1000 * 60 * 60 * 24);
        assertEquals(7, diffDays, "Expiration date must be exactly 7 days after reservation date");
    }

    // =============================================
    // Delete reservation
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
