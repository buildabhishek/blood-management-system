package com.bms.controller;

import com.bms.dto.InventoryUpdateDto;
import com.bms.dto.SearchResponseDTO;
import com.bms.entity.*;
import com.bms.service.BloodInventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class BloodInventoryController {

    private final BloodInventoryService service;
    public BloodInventoryController(BloodInventoryService s) { this.service = s; }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PostMapping
    public ResponseEntity<BloodInventory> add(@Valid @RequestBody BloodInventory inv, Authentication auth) {
        return ResponseEntity.ok(service.add(inv, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/my")
    public ResponseEntity<List<BloodInventory>> getMine(Authentication auth) {
        return ResponseEntity.ok(service.getMyInventory(auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}")
    // BUG FIX: use InventoryUpdateDto (nullable Integer quantity) instead of entity directly
    public ResponseEntity<BloodInventory> update(@PathVariable Long id,
            @RequestBody InventoryUpdateDto dto, Authentication auth) {
        return ResponseEntity.ok(service.update(id, dto, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<BloodInventory>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getAll(page, size));
    }

    @PreAuthorize("hasAnyRole('HOSPITAL','BLOOD_BANK','ADMIN')")
    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam String bloodGroup,
            @RequestParam(defaultValue = "1") int quantity,
            @RequestParam(required = false) String component,   // BUG FIX: was present in frontend call but not wired to service
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        BloodGroup bg;
        try { bg = BloodGroup.fromLabel(bloodGroup); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }

        // BUG FIX: pass component to service (was silently dropped before)
        List<BloodInventory> results = service.search(bg, quantity, lat, lng, component);
        List<SearchResponseDTO> response = results.stream().map(inv -> {
            SearchResponseDTO dto = new SearchResponseDTO(inv);
            if (lat != null && lng != null && inv.getLatitude() != null && inv.getLongitude() != null)
                dto.setDistanceKm(Math.round(BloodInventoryService.haversineKm(lat, lng, inv.getLatitude(), inv.getLongitude()) * 10.0) / 10.0);
            return dto;
        }).toList();
        return ResponseEntity.ok(response);
    }
}
