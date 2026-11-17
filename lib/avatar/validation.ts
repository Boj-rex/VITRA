export const MAX_AVATAR_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export type SupportedAvatarExtension = "jpg" | "png" | "webp" | "gif";
export type SupportedAvatarMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface ValidatedAvatarResult {
  ok: true;
  mimeType: SupportedAvatarMime;
  extension: SupportedAvatarExtension;
  fileSizeBytes: number;
}

export interface AvatarValidationError {
  ok: false;
  error: string;
}

/**
 * Validates profile image upload against size limit (20MB) and binary magic bytes.
 */
export function validateAvatarImage(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  maxBytes = MAX_AVATAR_UPLOAD_BYTES
): ValidatedAvatarResult | AvatarValidationError {
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: "The uploaded image file is empty." };
  }

  if (buffer.length > maxBytes) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      error: `Profile image (${sizeMb} MB) exceeds the maximum allowed limit of 20MB.`,
    };
  }

  const lower = fileName.toLowerCase().trim();
  const ext: SupportedAvatarExtension | null =
    lower.endsWith(".jpg") || lower.endsWith(".jpeg")
      ? "jpg"
      : lower.endsWith(".png")
      ? "png"
      : lower.endsWith(".webp")
      ? "webp"
      : lower.endsWith(".gif")
      ? "gif"
      : null;

  if (!ext) {
    return {
      ok: false,
      error: "Only JPG, PNG, WebP, and GIF images are supported.",
    };
  }

  // Validate magic bytes (file signature)
  if (ext === "jpg") {
    // JPEG header: FF D8 FF
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return {
        ok: false,
        error: "This file does not appear to be a valid JPEG image (invalid file signature).",
      };
    }
    return {
      ok: true,
      mimeType: "image/jpeg",
      extension: "jpg",
      fileSizeBytes: buffer.length,
    };
  }

  if (ext === "png") {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    if (!isPng) {
      return {
        ok: false,
        error: "This file does not appear to be a valid PNG image (invalid file signature).",
      };
    }
    return {
      ok: true,
      mimeType: "image/png",
      extension: "png",
      fileSizeBytes: buffer.length,
    };
  }

  if (ext === "gif") {
    // GIF header: GIF87a or GIF89a
    const header = buffer.subarray(0, 6).toString("ascii");
    if (header !== "GIF87a" && header !== "GIF89a") {
      return {
        ok: false,
        error: "This file does not appear to be a valid GIF image (invalid file signature).",
      };
    }
    return {
      ok: true,
      mimeType: "image/gif",
      extension: "gif",
      fileSizeBytes: buffer.length,
    };
  }

  if (ext === "webp") {
    // WebP: RIFF at 0..4 and WEBP at 8..12
    if (buffer.length < 12) {
      return { ok: false, error: "The WebP image header is truncated or invalid." };
    }
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") {
      return {
        ok: false,
        error: "This file does not appear to be a valid WebP image (invalid file signature).",
      };
    }
    return {
      ok: true,
      mimeType: "image/webp",
      extension: "webp",
      fileSizeBytes: buffer.length,
    };
  }

  return { ok: false, error: "Unsupported image format." };
}
