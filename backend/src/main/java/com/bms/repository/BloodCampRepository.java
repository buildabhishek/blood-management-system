package com.bms.repository;

import com.bms.entity.BloodCamp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BloodCampRepository extends JpaRepository<BloodCamp, Long> {

    List<BloodCamp> findByOrganiserPhone(String phone);
}
