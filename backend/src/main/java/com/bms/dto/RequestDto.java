package com.bms.dto;

import com.bms.entity.BloodGroup;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RequestDto {
    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @Min(1) @Max(50)
    private int quantity;

    @NotBlank
    private String urgency;

    private Long bloodBankId;
    private String notes;
    private String hospitalName; // display only, identity comes from JWT
}
