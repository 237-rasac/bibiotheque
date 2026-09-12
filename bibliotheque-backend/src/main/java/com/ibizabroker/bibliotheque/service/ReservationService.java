package com.ibizabroker.bibliotheque.service;

import com.ibizabroker.bibliotheque.dao.BooksRepository;
import com.ibizabroker.bibliotheque.dao.ReservationRepository;
import com.ibizabroker.bibliotheque.dao.UsersRepository;
import com.ibizabroker.bibliotheque.entity.*;
import com.ibizabroker.bibliotheque.exceptions.ConflictException;
import com.ibizabroker.bibliotheque.exceptions.ForbiddenException;
import com.ibizabroker.bibliotheque.exceptions.NotFoundException;
import com.ibizabroker.bibliotheque.exceptions.UnauthorizedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
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

    // =====================================================
    // Sécurité : identité et rôle extraits du contexte Spring
    // (jamais du corps de la requête - RS-04)
    // =====================================================

    /**
     * RS-04 : l'identité de l'appelant provient exclusivement du
     * SecurityContextHolder (rempli par JwtRequestFilter à partir du token JWT).
     * Le client ne peut jamais se faire passer pour un autre adhérent.
     */
    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentification requise : jeton absent ou invalide.");
        }
        Object principal = authentication.getPrincipal();
        String username = null;
        if (principal instanceof UserDetails) {
            // Cas de la production : JwtRequestFilter pose un principal UserDetails
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }
        if (username == null || "anonymousUser".equals(username)) {
            throw new UnauthorizedException("Authentification requise : jeton absent ou invalide.");
        }
        final String tokenUsername = username;
        Users user = usersRepository.findByUsername(tokenUsername)
                .orElseThrow(() -> new UnauthorizedException(
                        "Utilisateur introuvable pour le jeton fourni : " + tokenUsername));
        return user.getUserId();
    }

    /**
     * RS-02 : un ADHERENT n'a pas les droits du BIBLIOTHECAIRE.
     * Le rôle est lu depuis les authorities du token (ROLE_BIBLIOTHECAIRE).
     */
    private boolean isBibliothecaire() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_BIBLIOTHECAIRE".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    /**
     * RS-03 : un ADHERENT ne peut accéder qu'à ses propres réservations.
     */
    private void checkOwnership(Reservation reservation, Integer currentUserId) {
        if (!isBibliothecaire() && !reservation.getAdherent().getUserId().equals(currentUserId)) {
            throw new ForbiddenException(
                    "Accès interdit : cette réservation n'appartient pas à l'utilisateur connecté.");
        }
    }

    /**
     * POST /api/reservations - Create a new reservation
     * Security rules enforced:
     * - RS-04 (critical): the reserved identity comes from the JWT token
     *   (SecurityContextHolder), NEVER from request.getAdherentId().
     * Business rules enforced:
     * - RG-01: Book must be currently unavailable (noOfCopies < 1)
     * - RG-02: Member cannot have more than one active reservation for the same book
     * - RG-03: Member cannot have more than 3 active reservations simultaneously
     * - RG-04: Expiration date = dateReservation + 7 days (server-side)
     */
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        // Identity from the security context, not from the request body (RS-04)
        Integer currentUserId = getCurrentUserId();

        // Validate required fields (400)
        if (request.getLivreId() == null) {
            throw new IllegalArgumentException("livreId is required");
        }

        // Find book (404 if not found)
        Books book = booksRepository.findById(request.getLivreId())
                .orElseThrow(() -> new NotFoundException(
                        "Livre with id " + request.getLivreId() + " does not exist."));

        // The reservation is always created for the authenticated user (RS-04)
        Users adherent = usersRepository.findById(currentUserId)
                .orElseThrow(() -> new UnauthorizedException(
                        "Utilisateur with id " + currentUserId + " does not exist."));

        // RG-01: Book must be currently unavailable (noOfCopies < 1)
        // Copies null traitées comme "donnée invalide" plutôt que NPE (500).
        if (book.getNoOfCopies() == null) {
            throw new IllegalArgumentException(
                    "Le livre \"" + book.getBookName() + "\" a un nombre de copies invalide. Contactez un bibliothécaire.");
        }
        if (book.getNoOfCopies() >= 1) {
            throw new ConflictException(
                    "Le livre \"" + book.getBookName() + "\" est disponible (copies restantes: "
                            + book.getNoOfCopies() + "). Une réservation n'est possible que pour un livre indisponible.",
                    "RG-01");
        }

        // RG-02: Member cannot have more than one active reservation for the same book
        List<Reservation> existingForBook = reservationRepository
                .findByAdherentUserIdAndLivreBookIdAndStatutIn(
                        currentUserId, request.getLivreId(), ACTIVE_STATUTS);
        if (!existingForBook.isEmpty()) {
            throw new ConflictException(
                    "Vous avez déjà une réservation active pour le livre \"" + book.getBookName() + "\".",
                    "RG-02");
        }

        // RG-03: Member cannot have more than 3 active reservations simultaneously
        long activeCount = reservationRepository.countByAdherentUserIdAndStatutIn(
                currentUserId, ACTIVE_STATUTS);
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
     * GET /api/reservations - List reservations with optional status filter.
     * Security rules enforced:
     * - RS-05: an ADHERENT only ever sees his own reservations, whatever
     *   adherentId filter he tries to pass.
     * - BIBLIOTHECAIRE: sees all reservations (optionally filtered by member).
     */
    public List<ReservationResponse> listReservations(ReservationStatut statut, Integer adherentId) {
        if (isBibliothecaire()) {
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

        // RS-05: an ADHERENT is always scoped to his own reservations (RS-03)
        Integer currentUserId = getCurrentUserId();
        List<Reservation> reservations;
        if (statut != null) {
            reservations = reservationRepository.findByAdherentUserIdAndStatut(currentUserId, statut);
        } else {
            reservations = reservationRepository.findByAdherentUserId(currentUserId);
        }
        return reservations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/reservations/{id} - Get details of a specific reservation
     * Security rule enforced:
     * - RS-03: an ADHERENT can only read his own reservation (403 otherwise).
     */
    public ReservationResponse getReservationById(Integer id) {
        Integer currentUserId = getCurrentUserId();
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Réservation avec id " + id + " n'existe pas."));
        checkOwnership(reservation, currentUserId);
        return toResponse(reservation);
    }

    /**
     * PATCH /api/reservations/{id}/annuler - Cancel a reservation
     * Security rules enforced:
     * - RS-03: an ADHERENT can only cancel his own reservation (403 otherwise).
     * Business rules:
     * - RG-05: Can only cancel if status is EN_ATTENTE or DISPONIBLE
     * - RG-06: ANNULEE, EXPIREE, HONOREE cannot change status
     */
    @Transactional
    public ReservationResponse cancelReservation(Integer id) {
        Integer currentUserId = getCurrentUserId();
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Réservation avec id " + id + " n'existe pas."));

        checkOwnership(reservation, currentUserId);

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
     * DELETE /api/reservations/{id} - Delete a reservation.
     * Security rule enforced:
     * - RS-02: BIBLIOTHECAIRE only (URL rule + @PreAuthorize in the controller).
     */
    @Transactional
    public void deleteReservation(Integer id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Réservation avec id " + id + " n'existe pas."));
        reservationRepository.delete(reservation);
    }

    /**
     * GET /api/reservations/expired - List expired reservations.
     * RS-05: an ADHERENT only sees his own expired reservations,
     * a BIBLIOTHECAIRE sees all of them.
     */
    public List<ReservationResponse> listExpiredReservations() {
        List<Reservation> expired = reservationRepository
                .findByStatutAndDateExpirationBefore(ReservationStatut.EN_ATTENTE, new Date());
        if (!isBibliothecaire()) {
            Integer currentUserId = getCurrentUserId();
            expired = expired.stream()
                    .filter(r -> r.getAdherent().getUserId().equals(currentUserId))
                    .collect(Collectors.toList());
        }
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
