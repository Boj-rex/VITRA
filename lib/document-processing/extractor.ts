import mammoth from "mammoth";
import { extractText } from "unpdf";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export type SupportedCvFileType = "pdf" | "docx";

export interface ValidatedFileResult {
  ok: true;
  fileType: SupportedCvFileType;
}

export interface FileValidationError {
  ok: false;
  error: string;
}

/**
 * Validates extension, file size, and actual binary magic bytes (never trusting extension alone).
 */
export function validateUploadedCvFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  maxBytes = MAX_UPLOAD_BYTES
): ValidatedFileResult | FileValidationError {
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: "The uploaded file is empty." };
  }

  if (buffer.length > maxBytes) {
    return {
      ok: false,
      error: `File exceeds the maximum size limit of ${Math.round(maxBytes / (1024 * 1024))} MB.`,
    };
  }

  const lower = fileName.toLowerCase().trim();
  const ext = lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".docx") ? "docx" : null;

  if (!ext) {
    return {
      ok: false,
      error: "Only PDF (.pdf) and Microsoft Word (.docx) files are supported.",
    };
  }

  if (ext === "pdf") {
    // Check PDF header signature (%PDF-)
    const header = buffer.subarray(0, 5).toString("ascii");
    if (header !== "%PDF-") {
      return {
        ok: false,
        error: "This file does not appear to be a valid PDF document (invalid file signature).",
      };
    }
    if (
      mimeType &&
      mimeType !== "application/pdf" &&
      mimeType !== "application/octet-stream"
    ) {
      return {
        ok: false,
        error: "Unexpected MIME type for a PDF document.",
      };
    }
    return { ok: true, fileType: "pdf" };
  }

  // DOCX is a ZIP container starting with PK\x03\x04 and containing word/document.xml
  const isZip =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

  if (!isZip) {
    return {
      ok: false,
      error: "This file does not appear to be a valid DOCX document (invalid archive signature).",
    };
  }

  const hasWordXml = buffer.includes(Buffer.from("word/document.xml", "ascii"));
  if (!hasWordXml) {
    return {
      ok: false,
      error: "The uploaded archive is not a valid Word (.docx) document.",
    };
  }

  return { ok: true, fileType: "docx" };
}

export async function extractTextFromCvBuffer(
  buffer: Buffer,
  fileType: SupportedCvFileType
): Promise<{ text: string; warnings: string[] }> {
  if (fileType === "pdf") {
    const uint8 = new Uint8Array(buffer);
    const result = await extractText(uint8, { mergePages: true });
    const text = (Array.isArray(result.text) ? result.text.join("\n") : result.text || "").trim();
    const warnings: string[] = [];
    if (text.length < 40) {
      warnings.push(
        "Very little selectable text was found in this PDF. If it is a scanned image PDF, please review and enter missing sections manually."
      );
    }
    return { text, warnings };
  }

  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value || "").trim();
  const warnings = (result.messages || [])
    .filter((m) => m.type === "warning")
    .map((m) => m.message);
  if (text.length < 40) {
    warnings.push("Very little readable text was extracted from this DOCX file. Please review carefully.");
  }
  return { text, warnings };
}

