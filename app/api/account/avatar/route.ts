import { NextResponse } from "next/server";
import path from "path";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isLocalDevModeAllowed, isSupabaseConfigured } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDevDb } from "@/lib/data/local-dev-store";
import {
  MAX_AVATAR_UPLOAD_BYTES,
  validateAvatarImage,
} from "@/lib/avatar/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/account/avatar?file=filename
 * Streams locally stored avatar images with caching headers.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json({ ok: false, error: "File name is required." }, { status: 400 });
    }

    const safeName = path.basename(fileName);
    const fileData = localDevDb.getUserAvatarBuffer(safeName);

    if (!fileData) {
      return NextResponse.json({ ok: false, error: "Avatar image not found." }, { status: 404 });
    }

    return new Response(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        "Content-Type": fileData.mimeType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": fileData.buffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load avatar.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/account/avatar
 * Uploads a user profile image (max 20MB limit enforced).
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData.get("file") || formData.get("avatar")) as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Please attach an image file (JPG, PNG, WebP, or GIF)." },
        { status: 400 }
      );
    }

    // Explicit size check against 20MB cap
    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          ok: false,
          error: `Profile image (${sizeMb} MB) exceeds the maximum allowed limit of 20MB.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deep validation of magic bytes and extension
    const validation = validateAvatarImage(file.name, file.type, buffer, MAX_AVATAR_UPLOAD_BYTES);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    // 1. If Supabase is configured, attempt upload to storage
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          const storagePath = `${user.id}/avatar_${Date.now()}.${validation.extension}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(storagePath, buffer, {
              contentType: validation.mimeType,
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("avatars")
              .getPublicUrl(storagePath);
            const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

            await supabase
              .from("profiles")
              .update({ avatar_url: avatarUrl })
              .eq("id", user.id);

            return NextResponse.json({
              ok: true,
              avatarUrl,
              message: "Profile image updated successfully.",
            });
          }
        }
      } catch (err) {
        console.warn("[Avatar] Supabase upload failed, falling back to local store:", err);
      }
    }

    // 2. Local dev store fallback
    if (isLocalDevModeAllowed()) {
      const avatarUrl = localDevDb.saveUserAvatar(
        user.id,
        file.name,
        buffer,
        validation.mimeType
      );
      return NextResponse.json({
        ok: true,
        avatarUrl,
        message: "Profile image updated successfully.",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Storage backend unavailable." },
      { status: 500 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload profile image.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/account/avatar
 * Removes the user's profile image.
 */
export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseServerClient();
        if (supabase) {
          await supabase
            .from("profiles")
            .update({ avatar_url: null })
            .eq("id", user.id);
        }
      } catch (err) {
        console.warn("[Avatar] Supabase removal failed:", err);
      }
    }

    if (isLocalDevModeAllowed()) {
      localDevDb.deleteUserAvatar(user.id);
    }

    return NextResponse.json({
      ok: true,
      message: "Profile image removed successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete profile image.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
