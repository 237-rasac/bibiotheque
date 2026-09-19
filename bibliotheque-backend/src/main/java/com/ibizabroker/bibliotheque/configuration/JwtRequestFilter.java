package com.ibizabroker.bibliotheque.configuration;

import com.ibizabroker.bibliotheque.service.JwtService;
import com.ibizabroker.bibliotheque.util.JwtCookieUtil;
import com.ibizabroker.bibliotheque.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    @Lazy
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
        } else {
            // Pas de header Authorization : repli sur le cookie httpOnly (stockage XSS-safe)
            jwtToken = JwtCookieUtil.extractJwtFromCookie(request);
        }

        if (jwtToken != null) {
            try {
                username = jwtUtil.getUsernameFromToken(jwtToken);
            } catch (IllegalArgumentException e) {
                // Token mal forme : aucun utilisateur ne sera authentifie -> 401
                System.out.println("Unable to get JWT Token");
            } catch (JwtException e) {
                // ExpiredJwtException, MalformedJwtException, SignatureException...
                System.out.println("JWT Token invalid or expired");
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = jwtService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwtToken, userDetails)) {

                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    usernamePasswordAuthenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                }
            } catch (Exception e) {
                // User no longer exists or account disabled : ignore, treat as unauthenticated
                System.out.println("JWT user not found or disabled: " + username);
            }
        }
        filterChain.doFilter(request, response);

    }

}