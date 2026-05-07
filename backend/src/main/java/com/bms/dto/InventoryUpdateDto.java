package com.bms.dto;

import com.bms.entity.BloodGroup;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * BUG FIX: Dedicated DTO for inventory updates so quantity is nullable (Integer, not int).
 * Using the entity directly for updates meant quantity=0 (primitive default) was
 * indistinguishable from "client didn't send quantity" — caused silent update skips.
 */
@Getter @Setter
public class InventoryUpdateDto {
    private BloodGroup bloodGroup;
    private String     category;
    private Integer    quantity;          // nullable — only update if explicitly provided
    private LocalDate  collectionDate;
    private LocalDate  expiryDate;
    private String     unitId;
    private Integer    volumeMl;
    private int        lowStockThreshold = 5;
}
