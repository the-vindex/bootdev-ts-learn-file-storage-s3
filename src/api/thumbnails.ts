import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";

type Thumbnail = {
  data: ArrayBuffer;
  mediaType: string;
};

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB


export async function handlerUploadThumbnail(cfg: ApiConfig, req: BunRequest) {
  const { videoId } = req.params as { videoId?: string };
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  // Verify the video exists and belongs to the user
  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Video not found");
  }
  if (video.userID !== userID) {
    throw new UserForbiddenError("Video does not belong to user");
  }

  console.log("uploading thumbnail for video", videoId, "by user", userID);

  // Parse form data
  const formData = await req.formData();

  if (!(formData.get("thumbnail") instanceof File)) {
    throw new BadRequestError("Invalid thumbnail file");
  }
  const thumbnailFile = formData.get("thumbnail") as File;

  if (thumbnailFile.size > MAX_UPLOAD_SIZE) {
    throw new BadRequestError("Thumbnail file is too large");
  }

  const mediaType = thumbnailFile.type || "application/octet-stream";

  // Store the thumbnail data
  const arrayBuffer = await thumbnailFile.arrayBuffer();


  const thumbnailBase64 = Buffer.from(arrayBuffer).toString("base64");
  const thumbnailURL = `data:${mediaType};base64,${thumbnailBase64}`;

  video.thumbnailURL = thumbnailURL;
  updateVideo(cfg.db, video);

  return respondWithJSON(200, video);
}
