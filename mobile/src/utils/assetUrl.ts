import { apiBaseUrl } from "@/api/client";
import type { LevelId } from "@/types/contracts";

const levelImagePaths: Record<LevelId, string> = {
  "level-1": "/learning-images/level1-zebra-crossing.jpg",
  "level-2": "/learning-images/level2-school-crosswalk.jpg",
  "level-3": "/learning-images/level3-bus-line.jpg",
};

export function resolveAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = apiBaseUrl.replace(/\/api\/?$/i, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function getDefaultLevelImageUrl(levelId: LevelId) {
  return resolveAssetUrl(levelImagePaths[levelId]);
}

export function getDefaultThemeImageUrl() {
  return resolveAssetUrl("/learning-images/level1-controlled-crossing.jpg");
}
