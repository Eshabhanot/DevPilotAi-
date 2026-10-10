package com.devpilot.auth.controller;

import com.devpilot.auth.repository.RevokedTokenRepository;
import com.devpilot.auth.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AuthControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        revokedTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/auth/register should create user and return HTTP 201")
    void shouldRegisterUserSuccessfully() throws Exception {
        String requestJson = """
            {
                "name": "Integration User",
                "email": "integration@devpilot.ai",
                "password": "strongPassword123"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", is("Registration successful")));
    }

    @Test
    @DisplayName("POST /api/auth/register should reject duplicate email with HTTP 409 Conflict")
    void shouldRejectDuplicateRegistration() throws Exception {
        String requestJson = """
            {
                "name": "First User",
                "email": "duplicate@devpilot.ai",
                "password": "password123"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        // Attempting duplicate registration
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @DisplayName("POST /api/auth/register should reject invalid inputs with structured HTTP 400 ApiError")
    void shouldRejectInvalidInputs() throws Exception {
        // Missing name, invalid email, password too short
        String invalidJson = """
            {
                "name": "",
                "email": "not-an-email",
                "password": "short"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/auth/login should authenticate credentials and return signed JWT")
    void shouldLoginSuccessfully() throws Exception {
        registerUser("login@devpilot.ai", "correctPassword123");

        String loginJson = """
            {
                "email": "login@devpilot.ai",
                "password": "correctPassword123"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.expiresIn", greaterThan(0)));
    }

    @Test
    @DisplayName("POST /api/auth/login should return HTTP 401 for incorrect password")
    void shouldRejectIncorrectPassword() throws Exception {
        registerUser("auth@devpilot.ai", "correctPassword123");

        String wrongPasswordJson = """
            {
                "email": "auth@devpilot.ai",
                "password": "wrongPassword"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrongPasswordJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Protected endpoint should reject unauthenticated requests with HTTP 401")
    void shouldRejectUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/protected/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("Protected endpoint should accept valid Bearer token and identify user")
    void shouldAllowAuthenticatedAccess() throws Exception {
        registerUser("protected@devpilot.ai", "password123");
        String token = loginUser("protected@devpilot.ai", "password123");

        mockMvc.perform(get("/api/protected/test")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user", is("protected@devpilot.ai")));

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("protected@devpilot.ai")));
    }

    @Test
    @DisplayName("Logout should revoke JWT and subsequent access with revoked token should return HTTP 401")
    void shouldRevokeTokenOnLogoutAndRejectSubsequentAccess() throws Exception {
        registerUser("logout@devpilot.ai", "password123");
        String token = loginUser("logout@devpilot.ai", "password123");

        // 1. Token works before logout
        mockMvc.perform(get("/api/protected/test")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());

        // 2. Call logout with Bearer token
        mockMvc.perform(post("/api/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Logged out successfully")));

        // 3. Subsequent request with the same token is revoked -> rejected with 401
        mockMvc.perform(get("/api/protected/test")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("GET /api/auth/health should remain public and accessible without credentials")
    void shouldAllowPublicHealthAccess() throws Exception {
        mockMvc.perform(get("/api/auth/health"))
                .andExpect(status().isOk());
    }

    private void registerUser(String email, String password) throws Exception {
        String json = String.format("""
            {
                "name": "Test User",
                "email": "%s",
                "password": "%s"
            }
            """, email, password);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated());
    }

    private String loginUser(String email, String password) throws Exception {
        String json = String.format("""
            {
                "email": "%s",
                "password": "%s"
            }
            """, email, password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        return responseNode.get("token").asText();
    }
}
