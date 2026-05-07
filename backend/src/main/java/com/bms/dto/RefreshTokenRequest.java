package com.bms.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
@Getter @Setter
public class RefreshTokenRequest {
    @NotBlank private String refreshToken;
}
