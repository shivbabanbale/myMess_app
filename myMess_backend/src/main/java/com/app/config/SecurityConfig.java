package com.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF if not needed
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/auth/login",
                                "/auth/login_messOwner",
                                "/register",
                                "/update/**",
                                "/byEmail/**",
                                "/getAll",
                                "/profile/**",
                                "/mess/registerOwner",
                                "/mess/update/**",
                                "/joinMess/**",
                                "/mess/getUsers/**",
                                "/mess/profile/**",
                                "/mess/images/**",
                                "/image/{imageName}",
                                "/mess/image/{imageName}",
                                "/mess/actual-images",

                                "/mess/getAll",
                                "/feedback",
                                "/feedback/**",
                                "/auth/sendOtp",
                                "/auth/sendOtpToMess",
                                "/auth/verifyMess",
                                "/auth/verifyOtp",
                                "/api/bookings/book",
                                "/token",
                                "/attendance/mark",
                                "/attendance/fetch",
                                "/menu",
                                "/menu/**",
                                "mess/getById/**",
                                "/mess/getById/**",
                                "/menu/save",
                                "/menu/getByMessEmail/**",
                                "/menu/exists/**",
                                "/menu/delete/**",
                                "/menu/exists/{messEmail}",
                                "/payment/record",
                                "/payment/pending/user/{userEmail}/mess/{messId}",
                                "/payment/pending/user/{userEmail}/mess/{messId}",
                                "/payment/pending/user/{userEmail}/mess/{messId}",


                                "/payment/user/{userEmail}",
                                "/payment/mess/{messId}",
                                "/payment/user/{userEmail}/mess/{messId}",
                                "/payment/total-pending/mess/{messId}",
                                "/payment/date-range",
                                "mess/getByEmail/**",
                                "/mess/getByEmail/**",
                                "/leave/approve/**",
                                "/leave/reject/**",
                                // Leave application endpoints
                                "/leave/apply",
                                "/leave/**",
                                "/leave/user/**",
                                "/leave/mess/**",
                                "/leave/pending/mess/**",
                                "/leave/pending/owner/**",
                                "/leave/owner/**",
                                "/leave/mess/{messId}",
                                "/leave/owner/{ownerEmail}",
                                "/leave/user/{userId}/mess/{messId}",
                                "/leave/user/email/{userEmail}/owner/{ownerEmail}",
                                "/leave/pending/mess/{messId}",
                                "/leave/pending/owner/{ownerEmail}",
                                "/leave/mess/{messId}",
                                "/leave/owner/{ownerEmail}",
                                "/leave/user/{userId}/mess/{messId}",
                                "/leave/user/email/{userEmail}/owner/{ownerEmail}",
                                "/leave/pending/mess/{messId}",
                                "/leave/pending/owner/{ownerEmail}",
                                "/leave/approve/**",
                                "/leave/reject/**",
                                "/leave/mess/{messId}",
                                "/leave/owner/{ownerEmail}",
                                "/leave/user/{userId}/mess/{messId}",
                                "/leave/user/email/{userEmail}/owner/{ownerEmail}",
                                "/api/notifications/**",
                                "/api/notifications/send",
                                "/api/notifications/test",
                                "/api/notifications/user/{userEmail}",
                                "/api/notifications/user/{userEmail}/unread",
                                "/api/notifications/user/{userEmail}/unread/count",
                                "/api/notifications/{notificationId}/read",
                                "/api/notifications/user/{userEmail}/mark-all-read",
                                "/api/notifications/{notificationId}",
                                "/api/notifications/user/{userEmail}/delete",
                                "/api/notifications/user/{userEmail}/delete-all",
                                "/attendance/mark-selected",
                                "/attendance/present-dates",
                                "/attendance/present-dates-only",
                                "/attendance/present-dates/range",
                                "/attendance/monthly-summary",
                                "/attendance/by-owner",
                                "/attendance/by-user",
                                "/attendance/by-owner/range",
                                "/attendance/report",
                                "/attendance/delete/{id}",
                                "/attendance/mark-single",
                                "/attendance/present-dates?userEmail={userEmail}",
                                "/attendance/present-dates-only?userEmail={userEmail}",
                                "/attendance/present-dates/range?userEmail={userEmail}&startDate={startDate}&endDate={endDate}",
                                "/attendance/monthly-summary?userEmail={userEmail}&year={year}&month={month}",
                                "/attendance/by-owner?ownerEmail={ownerEmail}",
                                "/attendance/by-user?userEmail={userEmail}",
                                "/slot/book",
                                "/slot/check-availability",
                                "/slot/get-all",
                                "/slot/get-by-id/{id}",
                                "/slot/get-by-user/{userEmail}",
                                "/slot/get-by-mess/{messEmail}",
                                "/slot/get-pending-by-mess/{messEmail}",
                                "/slot/get-confirmed-by-mess/{messEmail}",
                                "/slot/get-by-date/{date}",
                                "/slot/get-by-date-and-mess/{date}/{messEmail}",
                                "/slot/get-by-user-and-status/{userEmail}/{status}",
                                "/slot/get-by-date-and-mess-and-status/{date}/{messEmail}/{status}",
                                "/slot/get-by-date-and-time-and-mess/{date}/{timeSlot}/{messEmail}",
                                "/slot/approve/{id}",
                                "/slot/confirm/{id}",
                                "/slot/cancel/{id}",
                                "/slot/update/{id}",
                                "/slot/delete/{id}",
                                "/slot/user/{userEmail}",
                                "/slot/mess/{messEmail}",
                                "/slot/pending/mess/{messEmail}",
                                "/slot/confirmed/mess/{messEmail}",
                                "/slot/date/{date}",
                                "/slot/date/{date}/mess/{messEmail}",
                                "/slot/user/{userEmail}/status/{status}",
                                "/slot/pay/{slot_id}"

                                
                                

                                
                                
                                
                                
                                
                                


                                )
                        .permitAll()
                        .anyRequest().authenticated() // Require authentication for all other requests
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

//http://192.168.120.112:8080/mess/getAll
