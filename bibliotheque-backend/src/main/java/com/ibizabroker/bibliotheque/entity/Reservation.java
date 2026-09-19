package com.ibizabroker.bibliotheque.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@NoArgsConstructor
@Table(name = "Reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reservationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "livre_id", nullable = false)
    private Books livre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "adherent_id", nullable = false)
    private Users adherent;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date dateReservation;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date dateExpiration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatut statut;
}
