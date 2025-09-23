import { test, expect, describe, beforeEach } from "bun:test";
import { createUser, getUserByEmail, getUser, getUsers, type User } from "../../src/db/users";
import { createTestConfig, resetTestDatabase } from "../setup";
import { createTestUserData } from "../fixtures";
import type { ApiConfig } from "../../src/config";
import type { Database } from "bun:sqlite";

/**
 * Helper method that creates a user and ensures it returns a non-null user.
 * Throws an error if the user creation fails.
 */
function createUserOrThrow(db: Database, userData: { email: string; password: string }): User {
  const user = createUser(db, userData);
  if (!user) {
    throw new Error(`Failed to create user with email: ${userData.email}`);
  }
  return user;
}

describe("User Database Operations", () => {
  let config: ApiConfig;

  beforeEach(() => {
    config = createTestConfig();
    resetTestDatabase(config.db);
  });

  describe("createUser", () => {
    test("should create a user with valid data", () => {
      const userData = {
        ...createTestUserData(),
        password: "hashed-password"
      };

      const user = createUserOrThrow(config.db, userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });


    test("should enforce unique email constraint", () => {
      const userData = {
        ...createTestUserData(),
        password: "password"
      };

      // Create first user
      createUserOrThrow(config.db, userData);

      // Try to create second user with same email
      expect(() => {
        createUserOrThrow(config.db, userData);
      }).toThrow();
    });
  });

  describe("getUserByEmail", () => {
    test("should return user when email exists", () => {
      const userData = {
        ...createTestUserData(),
        password: "hashed-password"
      };

      const createdUser = createUserOrThrow(config.db, userData);
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
      const userData = createTestUserData();

      createUserOrThrow(config.db, userData);

      const foundUser = getUserByEmail(config.db, userData.email.toUpperCase());
      expect(foundUser).toBeUndefined();
    });
  });

  describe("getUser", () => {
    test("should return user when ID exists", () => {
      const userData = {
        ...createTestUserData(),
        password: "hashed-password"
      };

      const createdUser = createUserOrThrow(config.db, userData);
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
        ...createTestUserData("user1"),
        password: "password1"
      };

      const userData2 = {
        ...createTestUserData("user2"),
        password: "password2"
      };

      createUserOrThrow(config.db, userData1);
      createUserOrThrow(config.db, userData2);

      const users = getUsers(config.db);

      expect(users).toHaveLength(2);
      expect(users.some(u => u.email === userData1.email)).toBe(true);
      expect(users.some(u => u.email === userData2.email)).toBe(true);
    });

    test("should return users with empty passwords", () => {
      const userData = {
        ...createTestUserData(),
        password: "secret-password"
      };

      createUserOrThrow(config.db, userData);
      const users = getUsers(config.db);

      expect(users).toHaveLength(1);
      // getUsers returns empty password for security (by design)
      expect(users[0].password).toBe("");
      expect(users[0].email).toBe(userData.email);
    });
  });
});