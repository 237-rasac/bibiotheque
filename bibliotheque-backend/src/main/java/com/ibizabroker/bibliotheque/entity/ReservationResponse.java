package com.ibizabroker.bibliotheque.entity;

import lombok.Data;

import java.util.Date;

@Data
public class ReservationResponse {
    private Integer reservationId;
    private Integer livreId;
    private String livreName;
    private Integer adherentId;
    private String adherentName;
    private Date dateReservation;
    private Date dateExpiration;
    private ReservationStatut statut;
}
