package com.bms.dto;
import com.bms.entity.BloodGroup;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter
public class RequestDto {
    @NotBlank private String patientName;
    private Integer patientAge;
    private String wardBed;
    private String attendingPhysician;
    @NotNull private BloodGroup bloodGroup;
    private String componentType;
    @Min(1) @Max(50) private int quantity;
    private String urgency;
    @NotNull(message="Please select a blood bank from search results") private Long bloodBankId;
    private String notes;
    private String receiptData;
    private String receiptFileName;
    private String receiptMimeType;
}
