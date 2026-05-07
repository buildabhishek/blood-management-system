package com.bms.dto;
import jakarta.validation.constraints.NotNull;
import lombok.*;
@Getter @Setter
public class RiderAssignDto {
    @NotNull private Long riderId;
}
