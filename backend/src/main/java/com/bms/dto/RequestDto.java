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

    @NotBlank(message = "Urgency is required")
    private String urgency;

    /** Must be provided — hospital must select a blood bank from search results */
    @NotNull(message = "Please search for blood availability and select a blood bank before submitting a request")
    private Long bloodBankId;

    private String notes;
    private String hospitalName; // display only

    /** Base64-encoded receipt (prescription / hospital letter) */
    private String receiptData;
    private String receiptFileName;
    private String receiptMimeType;
}
