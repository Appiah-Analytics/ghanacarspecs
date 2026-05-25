"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONFIDENCE_LEVEL_OPTIONS,
  PHOTO_SOURCE_TYPE_OPTIONS,
  PROVENANCE_TYPE_OPTIONS,
} from "@/lib/admin-form-options-client";
import { MAX_UPLOAD_BYTES, validateImageUpload } from "@/lib/admin-upload";

type Props = {
  vehicleId: string;
};

type UrlMode = "upload" | "manual";

export function AdminAddPhotoForm({ vehicleId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlMode, setUrlMode] = useState<UrlMode>("upload");
  const [photoUrl, setPhotoUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);

  const revokePreview = useCallback((src: string | null) => {
    if (src?.startsWith("blob:")) {
      URL.revokeObjectURL(src);
    }
  }, []);

  useEffect(() => {
    return () => revokePreview(previewSrc);
  }, [previewSrc, revokePreview]);

  function setPreviewFromFile(file: File) {
    revokePreview(previewSrc);
    setPreviewSrc(URL.createObjectURL(file));
  }

  function setPreviewFromUrl(url: string) {
    revokePreview(previewSrc);
    setPreviewSrc(url);
  }

  async function uploadFile(file: File) {
    const clientCheck = validateImageUpload(file);
    if (!clientCheck.ok) {
      setError(clientCheck.error);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadHint(null);
    setPreviewFromFile(file);

    const body = new FormData();
    body.append("file", file);
    body.append("vehicleId", vehicleId);

    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };

      if (res.status === 401) {
        router.push(`/admin/login?from=/admin/vehicles/${vehicleId}`);
        return;
      }

      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      setPhotoUrl(data.url);
      setPreviewFromUrl(data.url);
      setUploadHint("Upload complete — review metadata below, then save.");
    } catch {
      setError("Network error during upload — try again.");
    } finally {
      setUploading(false);
    }
  }

  function onFileChosen(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    void uploadFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    onFileChosen(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = photoUrl.trim();
    if (!url) {
      setError(urlMode === "upload" ? "Upload an image or switch to manual URL." : "Photo URL is required.");
      setSaving(false);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      url,
      caption: String(formData.get("caption") ?? ""),
      sourceType: String(formData.get("sourceType") ?? ""),
      sourceLabel: String(formData.get("sourceLabel") ?? ""),
      takenAt: String(formData.get("takenAt") ?? ""),
      provenanceType: String(formData.get("provenanceType") ?? ""),
      confidenceLevel: String(formData.get("confidenceLevel") ?? ""),
    };

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.status === 401) {
        router.push(`/admin/login?from=/admin/vehicles/${vehicleId}`);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not add photo.");
        return;
      }

      form.reset();
      setPhotoUrl("");
      revokePreview(previewSrc);
      setPreviewSrc(null);
      setUploadHint(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.push(`/admin/vehicles/${vehicleId}?photo=added`);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSaving(false);
    }
  }

  const busy = uploading || saving;

  return (
    <form className="admin-record-form" onSubmit={onSubmit}>
      <fieldset className="admin-url-mode">
        <legend className="admin-url-mode-legend">Image source</legend>
        <label className="admin-url-mode-option">
          <input
            type="radio"
            name="urlMode"
            value="upload"
            checked={urlMode === "upload"}
            onChange={() => setUrlMode("upload")}
          />
          Upload file
        </label>
        <label className="admin-url-mode-option">
          <input
            type="radio"
            name="urlMode"
            value="manual"
            checked={urlMode === "manual"}
            onChange={() => setUrlMode("manual")}
          />
          Manual URL
        </label>
      </fieldset>

      {urlMode === "upload" ? (
        <div
          className={`admin-upload-dropzone${uploading ? " is-uploading" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          role="group"
          aria-label="Upload visual evidence image"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
            className="admin-upload-input"
            disabled={busy}
            onChange={(e) => onFileChosen(e.target.files)}
          />
          <p className="admin-upload-dropzone-title">Drag and drop an image here</p>
          <p className="admin-upload-dropzone-hint">
            JPEG, PNG, WebP, GIF, AVIF, or HEIC — max {(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)} MB
          </p>
          <button
            type="button"
            className="admin-upload-browse"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Choose file"}
          </button>
        </div>
      ) : (
        <label className="admin-form-span">
          Photo URL <span className="admin-required">*</span>
          <input
            name="urlManual"
            type="text"
            value={photoUrl}
            onChange={(e) => {
              setPhotoUrl(e.target.value);
              if (e.target.value.trim()) setPreviewFromUrl(e.target.value.trim());
              else {
                revokePreview(previewSrc);
                setPreviewSrc(null);
              }
            }}
            placeholder="/demo-photos/toyota-tema-port-import.svg or https://…"
            spellCheck={false}
          />
          <span className="admin-field-hint">Must start with /demo-photos/, http://, or https://</span>
        </label>
      )}

      {previewSrc ? (
        <div className="admin-upload-preview">
          <p className="admin-upload-preview-label">Preview</p>
          <img src={previewSrc} alt="Upload preview" className="admin-upload-preview-img" />
        </div>
      ) : null}

      {photoUrl ? (
        <label className="admin-form-span">
          Stored URL (auto-filled after upload)
          <input type="text" name="url" value={photoUrl} readOnly spellCheck={false} className="admin-url-readonly" />
        </label>
      ) : null}

      {uploadHint ? (
        <p className="admin-upload-hint" role="status">
          {uploadHint}
        </p>
      ) : null}

      <div className="admin-form-grid">
        <label>
          Source type <span className="admin-required">*</span>
          <select name="sourceType" required defaultValue="OTHER">
            {PHOTO_SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Provenance <span className="admin-required">*</span>
          <select name="provenanceType" required defaultValue="OTHER">
            {PROVENANCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence <span className="admin-required">*</span>
          <select name="confidenceLevel" required defaultValue="LOW">
            {CONFIDENCE_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Caption
          <input name="caption" type="text" placeholder="What does this image show?" />
        </label>
        <label>
          Source label
          <input name="sourceLabel" type="text" placeholder="e.g. Partner intake (sample)" />
        </label>
        <label>
          Taken at
          <input name="takenAt" type="date" />
        </label>
      </div>
      {error ? (
        <p className="alert error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy || !photoUrl.trim()}>
        {saving ? "Saving…" : "Add visual evidence"}
      </button>
    </form>
  );
}
