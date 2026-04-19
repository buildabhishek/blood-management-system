package com.bms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class StatusDto {
    @NotBlank private String status;
    private String deliveryOtp; // for delivery confirmation
}
