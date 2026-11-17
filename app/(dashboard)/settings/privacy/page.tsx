"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatRelativeDate } from "@/lib/utils";

interface UploadItem {
  id: string;
  original_file_name?: string;
  originalFileName?: string;
  file_type?: string;
  fileType?: string;
  created_at?: string;
  createdAt?: string;
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.uploads)) {
          setUploads(d.uploads);
        }
      })
      .finally(() => setLoadingUploads(false));
  }, []);

  async function handleDeleteUpload(uploadId: string) {
    const res = await fetch(`/api/upload?uploadId=${encodeURIComponent(uploadId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to delete account.");
        setConfirmAccountDelete(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Network error while deleting account.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#173B30] hover:underline"
      >
        <span>Back to settings</span>
      </Link>

      <div>
        <h1 className="font-editorial text-3xl text-[#252821]">Privacy & Data Controls</h1>
        <p className="mt-1 text-sm text-[#77786F]">
          Manage your original uploaded CV files or permanently remove your account and all data.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-[#252821]">Original Uploaded Documents</h2>
        <p className="mt-1 text-xs text-[#77786F]">
          Original files are preserved privately and separately from your edited Vitra CVs.
        </p>

        {loadingUploads ? (
          <p className="mt-4 text-sm text-[#77786F]">Loading uploaded files...</p>
        ) : uploads.length === 0 ? (
          <p className="mt-4 text-sm text-[#77786F]">No original uploaded CV files stored.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E2DDD2] rounded-lg border border-[#E2DDD2]">
            {uploads.map((u) => {
              const name = u.original_file_name || u.originalFileName || "Document";
              const type = (u.file_type || u.fileType || "").toUpperCase();
              const date = u.created_at || u.createdAt || "";
              return (
                <li key={u.id} className="flex items-center justify-between gap-4 p-3.5 text-sm">
                  <div>
                    <p className="font-medium text-[#252821]">{name}</p>
                    <p className="text-xs text-[#77786F]">
                      {type} · Uploaded {formatRelativeDate(date)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUpload(u.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete file
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="border-red-200 p-6">
        <h2 className="font-semibold text-[#8F2424]">Delete Account & All Data</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#77786F]">
          Permanently delete your profile, all saved CVs, version history, analyses, and uploaded
          original files. This cannot be undone.
        </p>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
            {error}
          </div>
        )}
        <div className="mt-4">
          <Button variant="danger" onClick={() => setConfirmAccountDelete(true)}>
            Delete my account permanently
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmAccountDelete}
        title="Permanently delete your account?"
        description="Every CV, draft, version snapshot, and uploaded document in your Vitra account will be permanently erased."
        confirmLabel="Yes, delete everything"
        loading={deletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmAccountDelete(false)}
      />
    </div>
  );
}

