package com.bms.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
@Getter @Setter
public class StatusDto {
    @NotBlank private String status;
    private String reason;
    private String otp;
}
