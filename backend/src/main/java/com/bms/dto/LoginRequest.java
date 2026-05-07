package com.bms.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
@Getter @Setter
public class LoginRequest {
    @NotBlank private String phone;
    @NotBlank private String password;
    private String fcmToken;
}
