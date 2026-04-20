package com.bms.entity;

public enum RequestStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    CANCELLED,   // hospital cancelled before acceptance
    ASSIGNED,
    IN_TRANSIT,
    DELIVERED
}
