package com.bms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RiderAssignDto {
    @NotNull private Long riderId;
}
