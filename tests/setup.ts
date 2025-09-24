import { Database } from "bun:sqlite";
import { newDatabase, reset } from "../src/db/db";
import type { ApiConfig } from "../src/config";
import { unlink } from "node:fs/promises";
import { afterAll } from "bun:test";
import { createServer } from "../src/server";
import { ensureAssetsDir } from "../src/api/assets";

// Test database setup
const TEST_DB_PATH = "./tubely-test.db";

export function createTestConfig(): ApiConfig {
  const testDb = newDatabase(TEST_DB_PATH);

  return {
    db: testDb,
    jwtSecret: "test-jwt-secret-key-for-testing-only",
    platform: "test",
    filepathRoot: "./test-assets",
    assetsRoot: "./test-assets",
    s3Bucket: "test-bucket",
    s3Region: "us-east-1",
    s3CfDistribution: "test-distribution",
    port: "0" // Use any available port for tests
  };
}

export function resetTestDatabase(db: Database) {
  reset(db);
}

// Test server setup
export interface TestServer {
  server: any;
  baseUrl: string;
  config: ApiConfig;
}

export function createTestServer(config?: ApiConfig): TestServer {
  const testConfig = config || createTestConfig();
  
  // Ensure assets directory exists
  ensureAssetsDir(testConfig);

  // Use the same server configuration as the main app, but with port 0 for random assignment
  const server = createServer(testConfig, { port: 0 });

  testConfig.port = server.port!.toString();

  return {
    server,
    baseUrl: `http://localhost:${server.port}`,
    config: testConfig,
  };
}

export function stopTestServer(testServer: TestServer) {
  testServer.server?.stop();
}

// Cleanup test database after all tests
afterAll(async () => {
  try {
    await unlink(TEST_DB_PATH);
  } catch {
    // File might not exist, ignore error
  }
});