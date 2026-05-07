package com.bms.controller;

import com.bms.entity.*;
import com.bms.repository.*;
import com.bms.service.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

// ── Donor ─────────────────────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/donors")
class DonorController {
    private final DonorService service;
    DonorController(DonorService s) { service = s; }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PostMapping
    public ResponseEntity<Donor> add(@Valid @RequestBody Donor d, Authentication auth) {
        return ResponseEntity.ok(service.add(d, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/my")
    public ResponseEntity<List<Donor>> getMine(Authentication auth) {
        return ResponseEntity.ok(service.getMine(auth.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Donor>> getAll() { return ResponseEntity.ok(service.getAll()); }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}")
    public ResponseEntity<Donor> update(@PathVariable Long id, @RequestBody Donor d, Authentication auth) {
        return ResponseEntity.ok(service.update(id, d, auth.getName()));
    }

    @PreAuthorize("hasAnyRole('BLOOD_BANK','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
