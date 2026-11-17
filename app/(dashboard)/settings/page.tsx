"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ShieldAlert,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldLabel, Input } from "@/components/ui/input";

interface AccountState {
  id?: string;
  fullName: string;
  email: string;
  country: string;
  provider: string;
  avatarUrl?: string | null;
}

const MAX_AVATAR_BYTES = 20 * 1024 * 1024; // 20 MB

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [account, setAccount] = useState<AccountState | null>(null);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((accRes) => {
        if (accRes.ok && accRes.user) {
          setAccount(accRes.user);
          setFullName(accRes.user.fullName || "");
          setCountry(accRes.user.country || "Nigeria");
          if (accRes.user.avatarUrl) {
            setAvatarUrl(accRes.user.avatarUrl);
            setAvatarPreview(accRes.user.avatarUrl);
          }
        }
      })
      .catch(() => {
        // Silently catch fetch errors
      });
  }, []);

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarStatus(null);

    // 1. Enforce strict 20MB maximum size cap client-side
    if (file.size > MAX_AVATAR_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAvatarStatus({
        type: "error",
        text: `Selected image is ${sizeMb} MB. Profile images must not exceed the 20MB limit.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Validate supported image extensions & MIME types
    const validExtensions = /\.(jpe?g|png|webp|gif)$/i;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      setAvatarStatus({
        type: "error",
        text: "Please select a supported image format: JPG, PNG, WebP, or GIF.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 3. Set temporary local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAvatarStatus({
          type: "error",
          text: data.error || "Failed to upload profile image.",
        });
        setAvatarPreview(avatarUrl); // Revert preview to previous URL
      } else {
        setAvatarUrl(data.avatarUrl);
        setAvatarPreview(data.avatarUrl);
        setAvatarStatus({
          type: "success",
          text: "Profile image updated successfully.",
        });
        router.refresh();
      }
    } catch {
      setAvatarStatus({
        type: "error",
        text: "Network error occurred while uploading your profile image.",
      });
      setAvatarPreview(avatarUrl);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setDeletingAvatar(true);
    setAvatarStatus(null);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setAvatarStatus({
          type: "error",
          text: data.error || "Failed to remove profile image.",
        });
      } else {
        setAvatarUrl(null);
        setAvatarPreview(null);
        setAvatarStatus({
          type: "success",
          text: "Profile image removed.",
        });
        router.refresh();
      }
    } catch {
      setAvatarStatus({
        type: "error",
        text: "Network error while removing profile image.",
      });
    } finally {
      setDeletingAvatar(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, country }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "Could not update profile." });
      } else {
        setStatus({ type: "success", text: "Account profile saved." });
        router.refresh();
      }
    } catch {
      setStatus({ type: "error", text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  }

  const userInitial = fullName.trim() ? fullName.trim()[0].toUpperCase() : "U";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#173B30] dark:text-[#F8D849]">
            Account
          </p>
          <h1 className="mt-1 font-editorial text-3xl text-[#252821] dark:text-white">
            Account Settings
          </h1>
        </div>
        <Link
          href="/settings/privacy"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ShieldAlert className="h-4 w-4" />
          Privacy & Data Deletion
        </Link>
      </div>

      {/* Profile Photo Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
          <div>
            <h2 className="font-semibold text-lg text-[#252821] dark:text-white">Profile Photo</h2>
            <p className="text-xs text-[#55564E] dark:text-[#94A3B8] mt-0.5">
              Upload a picture for your candidate profile and workspace identity.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#173B30]/10 dark:bg-[#F8D849]/15 px-3 py-1 text-[11px] font-bold text-[#173B30] dark:text-[#F8D849]">
            Max Size: 20MB Cap
          </span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Display */}
          <div className="relative group shrink-0">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-full border-2 border-black dark:border-[#333C52] bg-[#173B30] text-white shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000]">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={fullName ? `${fullName}'s candidate profile picture` : "Candidate profile picture"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-editorial text-4xl sm:text-5xl font-black">
                  {userInitial}
                </span>
              )}

              {/* Uploading overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Camera badge trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar || deletingAvatar}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black dark:border-[#333C52] bg-[#F8D849] text-[#111111] shadow-[2px_2px_0px_#000000] hover:bg-[#FCE373] active:scale-95 transition-transform cursor-pointer"
              title="Change photo"
              aria-label="Upload profile image"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Controls & Rules */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarSelect}
                className="hidden"
                id="avatar-file-input"
              />

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={uploadingAvatar || deletingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload Image
                  </>
                )}
              </Button>

              {avatarPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingAvatar || deletingAvatar}
                  onClick={handleRemoveAvatar}
                  className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-900"
                >
                  {deletingAvatar ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="text-xs text-[#77786F] dark:text-[#94A3B8] space-y-1">
              <p>
                <strong>File limit:</strong> Up to 20MB per photo.
              </p>
              <p>
                <strong>Formats:</strong> JPG, PNG, WebP, GIF (square ratio recommended).
              </p>
            </div>

            {avatarStatus && (
              <div
                className={`mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${avatarStatus.type === "success"
                  ? "border-[#173B30]/30 bg-[#173B30]/8 text-[#173B30] dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                  }`}
              >
                {avatarStatus.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{avatarStatus.text}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Details Card */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg text-[#252821] dark:text-white">Profile Information</h2>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <FieldLabel htmlFor="set-name" required>
              Full name
            </FieldLabel>
            <Input
              id="set-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel htmlFor="set-email">Email address</FieldLabel>
            <Input id="set-email" value={account?.email || ""} disabled />
          </div>

          <div>
            <FieldLabel htmlFor="set-country" required>
              Primary country
            </FieldLabel>
            <Input
              id="set-country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {status && (
            <div
              className={`rounded-lg border px-4 py-2.5 text-sm ${status.type === "success"
                ? "border-[#173B30]/30 bg-[#173B30]/8 text-[#173B30] dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                }`}
            >
              {status.text}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
