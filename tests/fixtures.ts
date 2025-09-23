import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/auth";
import { createUser } from "../src/db/users";
import { createVideo, type Video } from "../src/db/videos";
import type { ApiConfig } from "../src/config";

export function generateUniqueEmail(prefix: string = "test"): string {
  const uniqueId = randomBytes(8).toString("hex");
  return `${prefix}-${uniqueId}@example.com`;
}

export interface TestUserData {
  email: string;
  password: string;
}

export function createTestUserData(emailPrefix?: string): TestUserData {
  return {
    email: generateUniqueEmail(emailPrefix),
    password: "password123"
  };
}

export async function createTestUser(
  config: ApiConfig,
  userData?: Partial<TestUserData>
) {
  const defaultUserData = createTestUserData();
  const finalUserData = { ...defaultUserData, ...userData };

  const hashedPassword = await hashPassword(finalUserData.password);
  const newUser = createUser(config.db, {
    email: finalUserData.email,
    password: hashedPassword
  });

  return {
    user: newUser!,
    credentials: finalUserData
  };
}

export function buildRequest(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = "GET", body, headers = {} } = options;

  // Don't set Content-Type header for FormData - let the browser set it with boundary
  const defaultHeaders = body instanceof FormData 
    ? { ...headers } 
    : { "Content-Type": "application/json", ...headers };

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body) {
    requestBody = JSON.stringify(body);
  }

  return new Request(`${baseUrl}${path}`, {
    method,
    headers: defaultHeaders,
    body: requestBody
  });
}

export function buildLoginRequest(baseUrl: string, credentials: TestUserData): Request {
  return buildRequest(baseUrl, "/api/login", {
    method: "POST",
    body: credentials
  });
}

export function buildAuthenticatedRequest(
  baseUrl: string,
  path: string,
  token: string,
  options: { method?: string; body?: any } = {}
): Request {
  return buildRequest(baseUrl, path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// HTTP request helpers for real server testing
export async function makeHttpRequest(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const request = buildRequest(baseUrl, path, options);
  return await fetch(request);
}

export async function makeLoginRequest(
  baseUrl: string,
  credentials: TestUserData
): Promise<Response> {
  return await makeHttpRequest(baseUrl, "/api/login", {
    method: "POST",
    body: credentials
  });
}

export async function makeAuthenticatedRequest(
  baseUrl: string,
  path: string,
  token: string,
  options: { method?: string; body?: any } = {}
): Promise<Response> {
  return await makeHttpRequest(baseUrl, path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function createTestVideo(config: ApiConfig, userId: string): Promise<Video> {
  const newVideo = createVideo(config.db, {
    userID: userId,
    title: "Test Video",
    description: "Test Description",
  });
  return newVideo!;
}
