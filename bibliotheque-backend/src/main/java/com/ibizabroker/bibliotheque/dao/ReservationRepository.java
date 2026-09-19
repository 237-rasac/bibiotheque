package com.ibizabroker.bibliotheque.dao;

import com.ibizabroker.bibliotheque.entity.Reservation;
import com.ibizabroker.bibliotheque.entity.ReservationStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findByAdherentUserId(Integer adherentId);

    List<Reservation> findByLivreBookId(Integer livreId);

    List<Reservation> findByStatut(ReservationStatut statut);

    List<Reservation> findByAdherentUserIdAndStatut(Integer adherentId, ReservationStatut statut);

    List<Reservation> findByAdherentUserIdAndLivreBookIdAndStatutIn(
            Integer adherentId, Integer livreId, List<ReservationStatut> statuts);

    long countByAdherentUserIdAndStatutIn(Integer adherentId, List<ReservationStatut> statuts);

    List<Reservation> findByStatutAndDateExpirationBefore(ReservationStatut statut, Date dateExpiration);
}
