package com.bms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserToken {

    @Id
    @GeneratedValue
    private Long id;

    private String token;
    private Long userId;
}
