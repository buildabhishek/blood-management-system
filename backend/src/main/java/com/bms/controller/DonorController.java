package com.bms.controller;

import com.bms.entity.Donor;
import com.bms.service.DonorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    private final DonorService donorService;

    public DonorController(DonorService donorService) {
        this.donorService = donorService;
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PostMapping
    public ResponseEntity<Donor> add(@Valid @RequestBody Donor donor, Authentication auth) {
        return ResponseEntity.ok(donorService.addDonor(donor, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/my")
    public ResponseEntity<List<Donor>> getMyDonors(Authentication auth) {
        return ResponseEntity.ok(donorService.getMyDonors(auth.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Donor>> getAll() {
        return ResponseEntity.ok(donorService.getAll());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}")
    public ResponseEntity<Donor> update(@PathVariable Long id,
            @Valid @RequestBody Donor donor, Authentication auth) {
        return ResponseEntity.ok(donorService.updateDonor(id, donor, auth.getName()));
    }

    // FIX 7: Always pass auth.getName() — DonorService now checks role internally
    @PreAuthorize("hasAnyRole('BLOOD_BANK', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        donorService.deleteDonor(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
