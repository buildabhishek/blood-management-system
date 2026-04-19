package com.bms.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeoService {

    // FIX: Match property key in application.properties
    @Value("${google.maps.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public double[] getLatLng(String address) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Google Maps API key not configured");
        }

        // FIX: Removed duplicate StandardCharsets import
        String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8);

        String url = "https://maps.googleapis.com/maps/api/geocode/json?address="
                + encodedAddress + "&key=" + apiKey;

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);

        if (response == null) {
            throw new RuntimeException("No response from Google Maps API");
        }

        @SuppressWarnings("unchecked")
        var results = (List<Map<String, Object>>) response.get("results");

        if (results == null || results.isEmpty()) {
            throw new RuntimeException("Location not found for address: " + address);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>)
                ((Map<String, Object>) results.get(0).get("geometry")).get("location");

        double lat = ((Number) location.get("lat")).doubleValue();
        double lng = ((Number) location.get("lng")).doubleValue();

        return new double[]{ lat, lng };
    }
}
