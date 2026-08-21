package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.*;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private static final List<ReservationStatut> ACTIVE_STATUTS = Arrays.asList(
            ReservationStatut.EN_ATTENTE,
            ReservationStatut.DISPONIBLE
    );

    private static final List<ReservationStatut> TERMINAL_STATUTS = Arrays.asList(
            ReservationStatut.ANNULEE,
            ReservationStatut.EXPIREE,
            ReservationStatut.HONOREE
    );

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private BooksRepository booksRepository;

    @Autowired
    private UsersRepository usersRepository;

    /**
     * POST /api/reservations - Create a new reservation
     * Business rules enforced:
     * - RG-01: Book must be currently unavailable (noOfCopies < 1)
     * - RG-02: Member cannot have more than one active reservation for the same book
     * - RG-03: Member cannot have more than 3 active reservations simultaneously
     * - RG-04: Expiration date = dateReservation + 7 days (server-side)
     */
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        // Validate required fields (400)
        if (request.getLivreId() == null || request.getAdherentId() == null) {
            throw new IllegalArgumentException("livreId and adherentId are required");
        }

        // Find book (404 if not found)
        Books book = booksRepository.findById(request.getLivreId())
                .orElseThrow(() -> new NotFoundException(
                        "Livre with id " + request.getLivreId() + " does not exist."));

        // Find member (404 if not found)
        Users adherent = usersRepository.findById(request.getAdherentId())
                .orElseThrow(() -> new NotFoundException(
                        "Utilisateur with id " + request.getAdherentId() + " does not exist."));

        // RG-01: Book must be currently unavailable (noOfCopies < 1)
        if (book.getNoOfCopies() >= 1) {
            throw new ConflictException(
                    "Le livre \"" + book.getBookName() + "\" est disponible (copies restantes: "
                            + book.getNoOfCopies() + "). Une réservation n'est possible que pour un livre indisponible.",
                    "RG-01");
        }

        // RG-02: Member cannot have more than one active reservation for the same book
        List<Reservation> existingForBook = reservationRepository
                .findByAdherentUserIdAndLivreBookIdAndStatutIn(
                        request.getAdherentId(), request.getLivreId(), ACTIVE_STATUTS);
        if (!existingForBook.isEmpty()) {
            throw new ConflictException(
                    "Vous avez déjà une réservation active pour le livre \"" + book.getBookName() + "\".",
                    "RG-02");
        }

        // RG-03: Member cannot have more than 3 active reservations simultaneously
        long activeCount = reservationRepository.countByAdherentUserIdAndStatutIn(
                request.getAdherentId(), ACTIVE_STATUTS);
        if (activeCount >= 3) {
            throw new ConflictException(
                    "Vous avez déjà 3 réservations actives. La limite maximale est atteinte.",
                    "RG-03");
        }

        // RG-04: Server-side date computation
        Date now = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.DATE, 7);

        Reservation reservation = new Reservation();
        reservation.setLivre(book);
        reservation.setAdherent(adherent);
        reservation.setDateReservation(now);
        reservation.setDateExpiration(cal.getTime());
        reservation.setStatut(ReservationStatut.EN_ATTENTE);

        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    /**
     * GET /api/reservations - List reservations with optional filtering by status and member
     */
    public List<ReservationResponse> listReservations(ReservationStatut statut, Integer adherentId) {
        List<Reservation> reservations;

        if (statut != null && adherentId != null) {
            reservations = reservationRepository.findByAdherentUserIdAndStatut(adherentId, statut);
        } else if (statut != null) {
            reservations = reservationRepository.findByStatut(statut);
        } else if (adherentId != null) {
            reservations = reservationRepository.findByAdherentUserId(adherentId);
        } else {
            reservations = reservationRepository.findAll();
        }

        return reservations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/reservations/{id} - Get details of a specific reservation
     */
    public ReservationResponse getReservationById(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Réservation avec id " + id + " n'existe pas."));
        return toResponse(reservation);
    }

    /**
     * PATCH /api/reservations/{id}/annuler - Cancel a reservation
     * - RG-05: Can only cancel if status is EN_ATTENTE or DISPONIBLE
     * - RG-06: ANNULEE, EXPIREE, HONOREE cannot change status
     */
    @Transactional
    public ReservationResponse cancelReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Réservation avec id " + id + " n'existe pas."));

        // RG-05 & RG-06: Only EN_ATTENTE or DISPONIBLE can be cancelled
        if (reservation.getStatut() != ReservationStatut.EN_ATTENTE
                && reservation.getStatut() != ReservationStatut.DISPONIBLE) {
            throw new ConflictException(
                    "Impossible d'annuler une réservation avec le statut " + reservation.getStatut()
                            + ". Seules les réservations EN_ATTENTE ou DISPONIBLE peuvent être annulées.",
                    "RG-05");
        }

        reservation.setStatut(ReservationStatut.ANNULEE);
        Reservation updated = reservationRepository.save(reservation);
        return toResponse(updated);
    }

    /**
     * DELETE /api/reservations/{id} - Delete a reservation
     */
    @Transactional
    public void deleteReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Réservation avec id " + id + " n'existe pas."));
        reservationRepository.delete(reservation);
    }

    /**
     * GET /api/reservations/expired - List expired reservations
     */
    public List<ReservationResponse> listExpiredReservations() {
        List<Reservation> expired = reservationRepository
                .findByStatutAndDateExpirationBefore(ReservationStatut.EN_ATTENTE, new Date());
        return expired.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Automatic task: update EN_ATTENTE reservations past their expiration to EXPIREE
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireOverdueReservations() {
        List<Reservation> overdue = reservationRepository
                .findByStatutAndDateExpirationBefore(ReservationStatut.EN_ATTENTE, new Date());
        for (Reservation r : overdue) {
            r.setStatut(ReservationStatut.EXPIREE);
        }
        reservationRepository.saveAll(overdue);
    }

    /**
     * Converts Reservation entity to ReservationResponse DTO
     * (entity is never exposed outside the service layer)
     */
    private ReservationResponse toResponse(Reservation reservation) {
        ReservationResponse response = new ReservationResponse();
        response.setReservationId(reservation.getReservationId());
        response.setLivreId(reservation.getLivre().getBookId());
        response.setLivreName(reservation.getLivre().getBookName());
        response.setAdherentId(reservation.getAdherent().getUserId());
        response.setAdherentName(reservation.getAdherent().getName());
        response.setDateReservation(reservation.getDateReservation());
        response.setDateExpiration(reservation.getDateExpiration());
        response.setStatut(reservation.getStatut());
        return response;
    }
}
