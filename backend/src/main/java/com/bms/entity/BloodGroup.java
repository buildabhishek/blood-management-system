package com.bms.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Blood group enum replacing free-text String fields.
 * JsonCreator allows case-insensitive deserialization: "a+" and "A+" both work.
 */
public enum BloodGroup {
    A_POS("A+"), A_NEG("A-"),
    B_POS("B+"), B_NEG("B-"),
    AB_POS("AB+"), AB_NEG("AB-"),
    O_POS("O+"), O_NEG("O-");

    private final String label;

    BloodGroup(String label) { this.label = label; }

    @JsonValue
    public String getLabel() { return label; }

    @JsonCreator
    public static BloodGroup fromLabel(String value) {
        if (value == null) throw new IllegalArgumentException("Blood group cannot be null");
        for (BloodGroup bg : values()) {
            if (bg.label.equalsIgnoreCase(value.trim())) return bg;
        }
        throw new IllegalArgumentException("Invalid blood group: " + value +
            ". Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-");
    }
}
