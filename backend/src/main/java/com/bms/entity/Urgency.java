package com.bms.entity;

/**
 * FIX: Removed unused LOW and HIGH values.
 * The frontend sends only NORMAL or URGENT, and the business logic only
 * distinguishes these two levels. Keeping dead enum values caused confusion
 * and would have required handling 4 values in switch statements / UI.
 *
 * NOTE: If your database already has rows with LOW or HIGH, run a migration
 * script to update them to NORMAL before deploying this change:
 * UPDATE blood_requests SET urgency = 'NORMAL' WHERE urgency IN ('LOW',
 * 'HIGH');
 */
public enum Urgency {
    NORMAL,
    URGENT
}
