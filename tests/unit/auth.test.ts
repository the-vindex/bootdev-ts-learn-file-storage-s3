import { test, expect, describe } from "bun:test";
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  getBearerToken,
  makeRefreshToken
} from "../../src/auth";

describe("Authentication", () => {
  describe("Password hashing", () => {
    test("should hash password correctly", async () => {
      const password = "test123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(10);
    });

    test("should verify correct password", async () => {
      const password = "test123";
      const hash = await hashPassword(password);

      const isValid = await checkPasswordHash(password, hash);
      expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const password = "test123";
      const wrongPassword = "wrong";
      const hash = await hashPassword(password);

      const isValid = await checkPasswordHash(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("JWT operations", () => {
    const secret = "test-secret";
    const userId = "user-123";

    test("should create valid JWT", () => {
      const expiresIn = 3600; // 1 hour
      const token = makeJWT(userId, secret, expiresIn);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    test("should validate JWT and return user ID", () => {
      const expiresIn = 3600;
      const token = makeJWT(userId, secret, expiresIn);

      const extractedUserId = validateJWT(token, secret);
      expect(extractedUserId).toBe(userId);
    });

    test("should reject JWT with wrong secret", () => {
      const expiresIn = 3600;
      const token = makeJWT(userId, secret, expiresIn);

      expect(() => {
        validateJWT(token, "wrong-secret");
      }).toThrow();
    });

    test("should reject JWT with wrong issuer", () => {
      // Create a token with wrong issuer manually
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        {
          iss: "wrong-issuer",
          sub: userId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        secret
      );

      expect(() => {
        validateJWT(token, secret);
      }).toThrow("Invalid issuer");
    });
  });

  describe("Bearer token extraction", () => {
    test("should extract token from valid Authorization header", () => {
      const token = "test-token-123";
      const headers = new Headers({
        "Authorization": `Bearer ${token}`
      });

      const extractedToken = getBearerToken(headers);
      expect(extractedToken).toBe(token);
    });

    test("should throw error when Authorization header is missing", () => {
      const headers = new Headers();

      expect(() => {
        getBearerToken(headers);
      }).toThrow("Missing Authorization Header");
    });

    test("should throw error when Authorization header is malformed", () => {
      const headers = new Headers({
        "Authorization": "NotBearer token123"
      });

      expect(() => {
        getBearerToken(headers);
      }).toThrow("Malformed Authorization header");
    });
  });

  describe("Refresh token", () => {
    test("should generate refresh token", () => {
      const token = makeRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });

    test("should generate unique tokens", () => {
      const token1 = makeRefreshToken();
      const token2 = makeRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });
});