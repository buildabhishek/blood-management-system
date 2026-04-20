package com.bms.controller;

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

@RestController
@RequestMapping("/api/inventory")
public class BloodInventoryController {

    private final BloodInventoryService inventoryService;

    public BloodInventoryController(BloodInventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PostMapping
    public ResponseEntity<BloodInventory> add(@Valid @RequestBody BloodInventory inventory,
            Authentication auth) {
        return ResponseEntity.ok(inventoryService.addBlood(inventory, auth.getName()));
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/my")
    public ResponseEntity<List<BloodInventory>> getMyInventory(Authentication auth) {
        return ResponseEntity.ok(inventoryService.getMyInventory(auth.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<BloodInventory>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(inventoryService.getAll(page, size));
    }

    /**
     * Hospital searches available blood — sorted by distance when lat/lng provided.
     */
    @PreAuthorize("hasAnyRole('HOSPITAL','BLOOD_BANK','ADMIN')")
    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam String bloodGroup,
            @RequestParam(defaultValue = "1") int quantity,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        BloodGroup bg;
        try { bg = BloodGroup.fromLabel(bloodGroup); }
        catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }

        List<BloodInventory> results = inventoryService.getAvailableBlood(bg, quantity, lat, lng);
        List<SearchResponseDTO> response = results.stream().map(inv -> {
            SearchResponseDTO dto = new SearchResponseDTO(inv);
            if (lat != null && lng != null && inv.getLatitude() != null && inv.getLongitude() != null) {
                dto.setDistanceKm(Math.round(
                    BloodInventoryService.haversineKm(lat, lng, inv.getLatitude(), inv.getLongitude())
                    * 10.0) / 10.0);
            }
            return dto;
        }).toList();

        return ResponseEntity.ok(response);
    }
}
