import { afterEach, beforeEach, describe, it, expect, afterAll } from "bun:test";
import { createTestServer, type TestServer, stopTestServer } from "../setup";
import { createTestUser, createTestVideo, makeAuthenticatedRequest, makeLoginRequest, type TestUserData } from "../fixtures";
import type { User } from "../../src/db/users";
import type { LoginResponse } from "../../src/api/auth";
import type { Video } from "../../src/db/videos";
import { rm } from "node:fs/promises";

describe("Thumbnail Upload", () => {
  let testServer: TestServer;
  let user: User;
  let credentials: TestUserData;
  let tokens: LoginResponse;
  let video: Video;

  afterAll(async () => {
    //delete all files in assets directory
    await rm(testServer.config.assetsRoot, { recursive: true });
  });

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
    const imageData = ["fake image data"];
    const { response, thumbnail } = await uploadTestThumbnail(imageData, testServer, video, tokens);

    const responseData = await response.json();
    expect(responseData).toBeDefined();

    //URL should be http://localhost:<port>/assets/<videoID>.<file_extension>
    expect(responseData.thumbnailURL).toContain(`http://localhost:${testServer.config.port}/assets/${video.id}.png`);
    
    const asset = Bun.file(`${testServer.config.assetsRoot}/${video.id}.png`);
    expect(await asset.exists(), "file should exist in assets directory").toBe(true);

    await verifySavedThumbnail(responseData.thumbnailURL, thumbnail);

    const {response: response2, thumbnail: thumbnail2} = await uploadTestThumbnail(["fake image 2"], testServer, video, tokens);
    const responseData2 = await response2.json();
    expect(responseData2.thumbnailURL, "thumbnail URL for video is derived from video, not file").toBe(responseData.thumbnailURL);
    
    await verifySavedThumbnail(responseData2.thumbnailURL, thumbnail2);

  });
});

async function verifySavedThumbnail(thumbnailURL: any, thumbnail: File) {
  const thumbnailResponse = await fetch(thumbnailURL);
  expect(thumbnailResponse.status).toBe(200);
  const thumbnailData = await thumbnailResponse.arrayBuffer();
  expect(thumbnailData).toBeDefined();
  expect(thumbnailData.byteLength).toBe(thumbnail.size);
}

async function uploadTestThumbnail(imageData: string[], testServer: TestServer, video: Video, tokens: LoginResponse) {
  const thumbnail = new File(imageData, "thumbnail.png", { type: "image/png" });

  const formData = new FormData();
  formData.append("thumbnail", thumbnail);

  const response = await makeAuthenticatedRequest(testServer.baseUrl, `/api/thumbnail_upload/${video.id}`, tokens.token, {
    method: "POST",
    body: formData,
  });
  expect(response.status).toBe(200);

  return { response, thumbnail };
}
