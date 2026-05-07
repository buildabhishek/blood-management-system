package com.bms.dto;
import com.bms.entity.BloodInventory;
import lombok.*;
@Getter @Setter
public class SearchResponseDTO {
    private Long id;
    private String location;
    private String bloodGroup;
    private int quantity;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;
    public SearchResponseDTO() {}
    public SearchResponseDTO(BloodInventory inv) {
        this.id=inv.getBloodBankId(); this.location=inv.getLocation();
        this.bloodGroup=inv.getBloodGroup().getLabel(); this.quantity=inv.getQuantity();
        this.latitude=inv.getLatitude(); this.longitude=inv.getLongitude();
    }
}
