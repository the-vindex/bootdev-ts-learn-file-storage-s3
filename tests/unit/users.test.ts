import { test, expect, describe, beforeEach } from "bun:test";
import { createUser, getUserByEmail, getUser, getUsers } from "../../src/db/users";
import { createTestConfig, resetTestDatabase } from "../setup";
import type { ApiConfig } from "../../src/config";

describe("User Database Operations", () => {
  let config: ApiConfig;

  beforeEach(() => {
    config = createTestConfig();
    resetTestDatabase(config.db);
  });

  describe("createUser", () => {
    test("should create a user with valid data", () => {
      const userData = {
        email: "test@example.com",
        password: "hashed-password"
      };

      const user = createUser(config.db, userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test("should generate unique IDs for different users", () => {
      const user1 = createUser(config.db, {
        email: "user1@example.com",
        password: "password1"
      });

      const user2 = createUser(config.db, {
        email: "user2@example.com",
        password: "password2"
      });

      expect(user1.id).not.toBe(user2.id);
    });

    test("should enforce unique email constraint", () => {
      const userData = {
        email: "test@example.com",
        password: "password"
      };

      // Create first user
      createUser(config.db, userData);

      // Try to create second user with same email
      expect(() => {
        createUser(config.db, userData);
      }).toThrow();
    });
  });

  describe("getUserByEmail", () => {
    test("should return user when email exists", () => {
      const userData = {
        email: "test@example.com",
        password: "hashed-password"
      };

      const createdUser = createUser(config.db, userData);
      const foundUser = getUserByEmail(config.db, userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.password).toBe(userData.password);
    });

    test("should return undefined when email does not exist", () => {
      const user = getUserByEmail(config.db, "nonexistent@example.com");
      expect(user).toBeUndefined();
    });

    test("should be case sensitive", () => {
      const userData = {
        email: "test@example.com",
        password: "password"
      };

      createUser(config.db, userData);

      const foundUser = getUserByEmail(config.db, "TEST@EXAMPLE.COM");
      expect(foundUser).toBeUndefined();
    });
  });

  describe("getUser", () => {
    test("should return user when ID exists", () => {
      const userData = {
        email: "test@example.com",
        password: "hashed-password"
      };

      const createdUser = createUser(config.db, userData);
      const foundUser = getUser(config.db, createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    test("should return undefined when ID does not exist", () => {
      const user = getUser(config.db, "non-existent-id");
      expect(user).toBeUndefined();
    });
  });

  describe("getUsers", () => {
    test("should return empty array when no users exist", () => {
      const users = getUsers(config.db);
      expect(users).toEqual([]);
    });

    test("should return all users", () => {
      const userData1 = {
        email: "user1@example.com",
        password: "password1"
      };

      const userData2 = {
        email: "user2@example.com",
        password: "password2"
      };

      createUser(config.db, userData1);
      createUser(config.db, userData2);

      const users = getUsers(config.db);

      expect(users).toHaveLength(2);
      expect(users.some(u => u.email === userData1.email)).toBe(true);
      expect(users.some(u => u.email === userData2.email)).toBe(true);
    });

    test("should return users with empty passwords", () => {
      const userData = {
        email: "test@example.com",
        password: "secret-password"
      };

      createUser(config.db, userData);
      const users = getUsers(config.db);

      expect(users).toHaveLength(1);
      // getUsers returns empty password for security (by design)
      expect(users[0].password).toBe("");
      expect(users[0].email).toBe(userData.email);
    });
  });
});