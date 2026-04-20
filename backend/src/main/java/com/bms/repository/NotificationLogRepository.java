package com.bms.repository;

import com.bms.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByRecipient_PhoneOrderByCreatedAtDesc(String phone);

    long countByRecipient_PhoneAndReadFalse(String phone);

    @Modifying
    @Transactional
    @Query("UPDATE NotificationLog n SET n.read = true WHERE n.recipient.phone = :phone")
    int markAllReadByPhone(@Param("phone") String phone);
}
