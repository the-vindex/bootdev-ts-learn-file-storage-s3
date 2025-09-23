import { handlerLogin, handlerRefresh, handlerRevoke } from "./api/auth";
import {
  errorHandlingMiddleware,
  cacheMiddleware,
  withConfig,
} from "./api/middleware";
import { handlerUsersCreate } from "./api/users";
import {
  handlerVideoGet,
  handlerVideoMetaCreate,
  handlerVideoMetaDelete,
  handlerVideosRetrieve,
} from "./api/video-meta";
import { handlerUploadVideo } from "./api/videos";
import { handlerUploadThumbnail, handlerGetThumbnail } from "./api/thumbnails";
import { handlerReset } from "./api/reset";
import type { ApiConfig } from "./config";
import spa from "./app/index.html";

export function createServer(config: ApiConfig, options: { port?: number } = {}) {
  const port = options.port ?? Number(config.port);

  return Bun.serve({
    port,
    development: config.platform === "dev",
    routes: {
      "/": spa,
      "/api/login": {
        POST: withConfig(config, handlerLogin),
      },
      "/api/refresh": {
        POST: withConfig(config, handlerRefresh),
      },
      "/api/revoke": {
        POST: withConfig(config, handlerRevoke),
      },
      "/api/users": {
        POST: withConfig(config, handlerUsersCreate),
      },
      "/api/videos": {
        GET: withConfig(config, handlerVideosRetrieve),
        POST: withConfig(config, handlerVideoMetaCreate),
      },
      "/api/videos/:videoId": {
        GET: withConfig(config, handlerVideoGet),
        DELETE: withConfig(config, handlerVideoMetaDelete),
      },
      "/api/thumbnail_upload/:videoId": {
        POST: withConfig(config, handlerUploadThumbnail),
      },
      "/api/thumbnails/:videoId": {
        GET: withConfig(config, handlerGetThumbnail),
      },
      "/api/video_upload/:videoId": {
        POST: withConfig(config, handlerUploadVideo),
      },
      "/admin/reset": {
        POST: withConfig(config, handlerReset),
      },
    },

    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      if (path.startsWith("/assets")) {
        return cacheMiddleware(() =>
          serveStaticFile(path.replace("/assets/", ""), config.assetsRoot)
        )(req);
      }

      return new Response("Not Found", { status: 404 });
    },

    error(err) {
      return errorHandlingMiddleware(config, err);
    },
  });
}

async function serveStaticFile(relativePath: string, basePath: string) {
  const filePath = `${basePath}/${relativePath}`;

  try {
    const f = Bun.file(filePath);
    return new Response(await f.bytes(), {
      headers: { "Content-Type": f.type || "application/octet-stream" },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
