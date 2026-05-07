package com.bms.dto;
import com.bms.entity.Role;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter
public class RegisterRequest {
    @NotBlank @Size(min=2,max=100) private String name;
    @NotBlank @Pattern(regexp="^[0-9]{10,15}$",message="Phone must be 10-15 digits") private String phone;
    @NotBlank @Size(min=6,message="Password min 6 chars") private String password;
    @NotNull private Role role;
    private String entityName;
    private String address;
    private Double latitude;
    private Double longitude;
    private String vehicleType;
    private String vehiclePlate;
    private String assignedZone;
}
