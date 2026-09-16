import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Vercel Functions have a request-body limit. Keep uploads comfortably below it.
const MAX_FILE_SIZE = 3.5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 50_000;

const ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  txt: ["text/plain", "application/octet-stream"],
  md: ["text/markdown", "text/plain", "application/octet-stream"],
  csv: ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"],
  json: ["application/json", "text/plain", "application/octet-stream"],
};

function jsonError(message: string, status = 400, details?: string) {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_SIZE + 512_000) {
      return jsonError("File is too large for Vercel. Maximum upload size is 3.5 MB.");
    }

    const formData = await request.formData();
    const value = formData.get("file");

    if (!(value instanceof File)) return jsonError("No file was uploaded.");
    if (value.size === 0) return jsonError("The uploaded file is empty.");
    if (value.size > MAX_FILE_SIZE) {
      return jsonError("File is too large for Vercel. Maximum upload size is 3.5 MB.");
    }

    const fileName = value.name.replace(/[\\/]/g, "_").trim() || "uploaded-file";
    const extension = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";

    if (!Object.prototype.hasOwnProperty.call(ALLOWED, extension)) {
      return jsonError("Unsupported file type. Upload PDF, DOCX, TXT, MD, CSV, or JSON.");
    }

    const declaredType = (value.type || "").toLowerCase();
    if (declaredType && !ALLOWED[extension].includes(declaredType)) {
      // Browsers frequently report application/octet-stream for DOCX/text files,
      // so only reject clearly conflicting MIME types.
      const generic = ["application/octet-stream", "text/plain"];
      if (!generic.includes(declaredType)) {
        return jsonError(`The file type does not match .${extension}.`);
      }
    }

    let extractedText = "";
    const buffer = Buffer.from(await value.arrayBuffer());

    if (["txt", "md", "csv", "json"].includes(extension)) {
      extractedText = buffer.toString("utf8");
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
      if (result.messages?.length) console.warn("DOCX extraction warnings:", result.messages);
    } else if (extension === "pdf") {
      const pdfModule = await import("pdf-parse");
      const parser = (pdfModule as any).default || pdfModule;
      if (typeof parser !== "function") {
        return jsonError("PDF support is unavailable in this deployment.", 500);
      }
      const result = await parser(buffer);
      extractedText = result?.text || "";
    }

    extractedText = extractedText.replace(/\u0000/g, "").trim();
    if (!extractedText) {
      return jsonError(
        extension === "pdf"
          ? "No selectable text was found. Scanned/image-only PDFs need OCR before they can be analyzed."
          : "No readable text was found in the uploaded file.",
        422
      );
    }

    const truncated = extractedText.length > MAX_TEXT_LENGTH;
    if (truncated) extractedText = extractedText.slice(0, MAX_TEXT_LENGTH);

    return NextResponse.json({
      success: true,
      file: { name: fileName, type: extension, size: value.size },
      text: extractedText,
      characterCount: extractedText.length,
      truncated,
      message: truncated
        ? "File uploaded successfully. The extracted text was shortened to fit the AI context."
        : "File uploaded and text extracted successfully.",
    });
  } catch (error) {
    console.error("Upload route error:", error);
    return jsonError(
      "Could not process the uploaded file.",
      500,
      error instanceof Error ? error.message : "Unknown upload error"
    );
  }
}
