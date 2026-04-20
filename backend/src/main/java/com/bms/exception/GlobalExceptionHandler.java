package com.bms.exception;

import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bean validation failures — e.g. @NotBlank, @Size, @Pattern on request body fields.
     * Returns a flat "fields" map so the frontend can show per-field errors.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Invalid value",
                (a, b) -> a   // keep first error per field
            ));
        return ResponseEntity.badRequest().body(Map.of(
            "error",  "Validation failed",
            "fields", fields
        ));
    }

    /**
     * Malformed JSON / unrecognised enum value in request body.
     * Without this, Spring Boot returns an HTML error page which the frontend
     * cannot parse — causing a silent failure.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleBadJson(HttpMessageNotReadableException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "";
        // Give a friendly message for the common case of an invalid enum
        String friendly = msg.contains("not one of the values accepted")
            ? "Invalid value provided. Please check your input and try again."
            : "Malformed request body. Please check your input.";
        return ResponseEntity.badRequest().body(Map.of("error", friendly));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArg(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    /**
     * All other RuntimeExceptions (e.g. "Phone number already registered").
     * Always returns JSON — never lets Spring Boot's default HTML error page through.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred"
        ));
    }

    /**
     * Catch-all for anything else — ensures the response is always JSON.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAll(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An unexpected error occurred. Please try again."));
    }
}
