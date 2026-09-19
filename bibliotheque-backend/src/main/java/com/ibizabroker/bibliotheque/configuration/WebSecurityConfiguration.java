package com.ibizabroker.bibliotheque.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Autowired
    private UserDetailsService jwtService;

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.cors();
        httpSecurity.csrf().disable()
                // API stateless : le JWT vit dans un cookie httpOnly, on désactive
                // le LogoutFilter par défaut de Spring (qui ferait une 302 vers /login?logout)
                // pour laisser notre endpoint REST /logout écraser le cookie.
                .logout().disable()
                // Endpoints publics : authentification, déconnexion (pour pouvoir écraser
                // le cookie même avec un token expiré), Swagger et préflight CORS.
                // Toute l'API de réservation (/api/reservations/**) est protégée : sans token -> 401 (RS-01).
                .authorizeRequests().antMatchers("/authenticate", "/logout", "/swagger-ui.html", "/swagger-ui/**",
                        "/api-docs/**", "/v3/api-docs/**").permitAll()
                .antMatchers(HttpMethod.OPTIONS).permitAll()
                .antMatchers(HttpHeaders.ALLOW).permitAll()
                // DELETE /api/reservations/{id} : bibliothécaire uniquement (RS-02)
                .antMatchers(HttpMethod.DELETE, "/api/reservations/**").hasRole("BIBLIOTHECAIRE")
                // Les autres méthodes de /api/reservations/** exigent un utilisateur authentifié :
                // le filtrage ADHERENT/BIBLIOTHECAIRE est affiné par @PreAuthorize dans le contrôleur
                // et par les règles de propriété dans le service (RS-03, RS-04, RS-05).
                .antMatchers("/api/reservations/**").authenticated()
                .anyRequest().authenticated()
                .and()
                .exceptionHandling().authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .and()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        ;

        httpSecurity.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder authenticationManagerBuilder) throws Exception {
        authenticationManagerBuilder.userDetailsService(jwtService).passwordEncoder(new BCryptPasswordEncoder());
    }
}