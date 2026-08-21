package com.ibizabroker.bibliotheque.controller;

import com.ibizabroker.bibliotheque.entity.ReservationRequest;
import com.ibizabroker.bibliotheque.entity.ReservationResponse;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import com.ibizabroker.bibliotheque.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("http://localhost:4200/")
@RestController
@RequestMapping("/api/reservations")
@Tag(name = "Reservation", description = "Gestion des réservations de livres")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @PostMapping
    @Operation(summary = "Créer une réservation",
            description = "Crée une nouvelle réservation pour un livre indisponible. " +
                    "Le serveur définit automatiquement les dates et le statut.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Réservation créée avec succès",
                    content = @Content(schema = @Schema(implementation = ReservationResponse.class))),
            @ApiResponse(responseCode = "400", description = "livreId ou adherentId manquant",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Livre ou utilisateur introuvable",
                    content = @Content),
            @ApiResponse(responseCode = "409", description = "Règle métier violée (RG-01, RG-02, RG-03)",
                    content = @Content)
    })
    public ResponseEntity<ReservationResponse> createReservation(
            @RequestBody ReservationRequest request) {
        ReservationResponse response = reservationService.createReservation(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Lister les réservations",
            description = "Liste toutes les réservations avec filtrage optionnel par statut et/ou membre.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste retournée avec succès",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReservationResponse.class))))
    })
    public ResponseEntity<List<ReservationResponse>> listReservations(
            @Parameter(description = "Filtrer par statut")
            @RequestParam(required = false) ReservationStatut statut,
            @Parameter(description = "Filtrer par identifiant du membre")
            @RequestParam(required = false) Integer adherentId) {
        List<ReservationResponse> reservations = reservationService.listReservations(statut, adherentId);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir une réservation par ID",
            description = "Retourne les détails d'une réservation spécifique.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Réservation trouvée",
                    content = @Content(schema = @Schema(implementation = ReservationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Réservation introuvable",
                    content = @Content)
    })
    public ResponseEntity<ReservationResponse> getReservationById(
            @Parameter(description = "Identifiant de la réservation")
            @PathVariable Integer id) {
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/annuler")
    @Operation(summary = "Annuler une réservation",
            description = "Annule une réservation. Seules les réservations EN_ATTENTE ou DISPONIBLE peuvent être annulées.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Réservation annulée avec succès",
                    content = @Content(schema = @Schema(implementation = ReservationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Réservation introuvable",
                    content = @Content),
            @ApiResponse(responseCode = "409", description = "Statut non annulable (RG-05)",
                    content = @Content)
    })
    public ResponseEntity<ReservationResponse> cancelReservation(
            @Parameter(description = "Identifiant de la réservation")
            @PathVariable Integer id) {
        ReservationResponse response = reservationService.cancelReservation(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une réservation",
            description = "Supprime définitivement une réservation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Réservation supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Réservation introuvable",
                    content = @Content)
    })
    public ResponseEntity<Void> deleteReservation(
            @Parameter(description = "Identifiant de la réservation")
            @PathVariable Integer id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/expired")
    @Operation(summary = "Lister les réservations expirées",
            description = "Retourne toutes les réservations dont la date d'expiration est dépassée " +
                    "et dont le statut est toujours EN_ATTENTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste retournée avec succès",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReservationResponse.class))))
    })
    public ResponseEntity<List<ReservationResponse>> listExpiredReservations() {
        List<ReservationResponse> expired = reservationService.listExpiredReservations();
        return ResponseEntity.ok(expired);
    }
}
