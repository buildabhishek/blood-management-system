package com.bms.dto;

public class NotificationDTO {
    private String message;

    public NotificationDTO(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
