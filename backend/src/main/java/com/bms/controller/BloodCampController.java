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

    private final BloodCampService service;
    public BloodCampController(BloodCampService s) { service = s; }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PostMapping
    public ResponseEntity<BloodCamp> create(@Valid @RequestBody BloodCamp camp, Authentication auth) {
        return ResponseEntity.ok(service.create(camp, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/my")
    public ResponseEntity<List<BloodCamp>> getMine(Authentication auth) {
        return ResponseEntity.ok(service.getMine(auth.getName()));
    }

    @PreAuthorize("hasAnyRole('ADMIN','BLOOD_BANK')")
    @GetMapping
    public ResponseEntity<List<BloodCamp>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PreAuthorize("hasAnyRole('BLOOD_BANK','ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<BloodCamp> update(@PathVariable Long id,
            @RequestBody BloodCamp camp, Authentication auth) {
        return ResponseEntity.ok(service.update(id, camp, auth.getName()));
    }

    @PreAuthorize("hasAnyRole('BLOOD_BANK','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
