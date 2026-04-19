package com.bms.dto;

import com.bms.entity.BloodInventory;

public class SearchResponseDTO {
    private Long id;
    private String location;
    private String bloodGroup;
    private int quantity;
    private Double latitude;
    private Double longitude;
    private Double distanceKm; // populated when coords available

    public SearchResponseDTO(BloodInventory inv) {
        this.id        = inv.getBloodBankId();
        this.location  = inv.getLocation();
        this.bloodGroup = inv.getBloodGroup().getLabel();
        this.quantity  = inv.getQuantity();
        this.latitude  = inv.getLatitude();
        this.longitude = inv.getLongitude();
    }

    public void setDistanceKm(Double d) { this.distanceKm = d; }

    public Long getId()          { return id; }
    public String getLocation()  { return location; }
    public String getBloodGroup(){ return bloodGroup; }
    public int getQuantity()     { return quantity; }
    public Double getLatitude()  { return latitude; }
    public Double getLongitude() { return longitude; }
    public Double getDistanceKm(){ return distanceKm; }
}
