package com.bms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class StatusDto {

    @NotBlank(message = "Status is required")
    private String status;

    /** Optional reason for rejection (shown to hospital) */
    private String reason;

    /** Delivery OTP — required when rider marks a request as DELIVERED */
    private String otp;
}
