import { afterEach, beforeEach, describe, it, expect } from "bun:test";
import { createTestServer, type TestServer, stopTestServer } from "../setup";
import { createTestUser, createTestVideo, makeAuthenticatedRequest, makeLoginRequest, type TestUserData } from "../fixtures";
import type { User } from "../../src/db/users";
import type { LoginResponse } from "../../src/api/auth";
import type { Video } from "../../src/db/videos";

describe("Thumbnail Upload", () => {
  let testServer: TestServer;
  let user: User;
  let credentials: TestUserData;
  let tokens: LoginResponse;
  let video: Video;

  beforeEach(async () => {
    testServer = createTestServer();
    ({user, credentials} = await createTestUser(testServer.config));
    const loginResponse = await makeLoginRequest(testServer.baseUrl, credentials);
    const loginData = await loginResponse.json();
    tokens = loginData;
    
    video = await createTestVideo(testServer.config, user.id);
  });

  afterEach(() => {
    stopTestServer(testServer);
  });

  it('should upload a thumbnail for a video', async () => {
    const thumbnail = new File(["fake image data"], "thumbnail.png", { type: "image/png" });
    
    const formData = new FormData();
    formData.append("thumbnail", thumbnail);

    const response = await makeAuthenticatedRequest(testServer.baseUrl, `/api/thumbnail_upload/${video.id}`, tokens.token, {
      method: "POST",
      body: formData,
    });

    expect(response.status).toBe(200);
    const thumbnailUploadResponseData = await response.json();
    //thumbnail upload returns updated video metadata with thumbnail URL
    expect(thumbnailUploadResponseData).toBeDefined();
    expect(thumbnailUploadResponseData.thumbnailURL).toBe(`http://localhost:${testServer.config.port}/api/thumbnails/${video.id}`);

    const thumbnailResponse = await makeAuthenticatedRequest(testServer.baseUrl, `/api/thumbnails/${video.id}`, tokens.token, {
      method: "GET",
    });
    expect(thumbnailResponse.status).toBe(200);
    const thumbnailData = await thumbnailResponse.arrayBuffer();
    expect(thumbnailData).toBeDefined();
    expect(thumbnailData.byteLength).toBe(thumbnail.size);


  });
});