package com.bms.controller;

import com.bms.entity.BloodCamp;
import com.bms.service.BloodCampService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camps")
public class BloodCampController {

    private final BloodCampService campService;

    public BloodCampController(BloodCampService campService) {
        this.campService = campService;
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PostMapping
    public ResponseEntity<BloodCamp> create(@Valid @RequestBody BloodCamp camp, Authentication auth) {
        return ResponseEntity.ok(campService.createCamp(camp, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/my")
    public ResponseEntity<List<BloodCamp>> getMyCamps(Authentication auth) {
        return ResponseEntity.ok(campService.getMyCamps(auth.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<BloodCamp>> getAll() {
        return ResponseEntity.ok(campService.getAll());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}")
    public ResponseEntity<BloodCamp> update(@PathVariable Long id,
            @Valid @RequestBody BloodCamp camp, Authentication auth) {
        return ResponseEntity.ok(campService.updateCamp(id, camp, auth.getName()));
    }

    @PreAuthorize("hasAnyRole('BLOOD_BANK', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        campService.deleteCamp(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
