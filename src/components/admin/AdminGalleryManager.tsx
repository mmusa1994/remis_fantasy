"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, RefreshCw, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  sort_order: number;
  league: string;
  created_at: string;
}

interface AdminGalleryManagerProps {
  league: "pl" | "cl" | "f1";
  isDark: boolean;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function AdminGalleryManager({
  league,
  isDark,
  onToast,
}: AdminGalleryManagerProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [league]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [selectedFile]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery?league=${league}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPhotos(data);
    } catch {
      onToast("Greška pri učitavanju galerije", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onToast("Odaberite sliku", "error");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to storage
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("league", league);

      const uploadRes = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await uploadRes.json();

      // 2. Create gallery record
      const createRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league,
          src: url,
          alt: alt || selectedFile.name,
          caption: caption || null,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to save record");

      onToast("Slika uspješno dodana!", "success");
      setSelectedFile(null);
      setAlt("");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadPhotos();
    } catch (e: any) {
      onToast(e.message || "Greška pri uploadu", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovu sliku?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      onToast("Slika obrisana", "success");
      await loadPhotos();
    } catch {
      onToast("Greška pri brisanju", "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div
        className={`rounded-md border p-4 sm:p-6 ${
          isDark
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          <Upload className="w-5 h-5" />
          Dodaj novu sliku
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Slika *
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className={`flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:cursor-pointer ${
                  isDark
                    ? "text-gray-400 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"
                    : "text-gray-700 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                }`}
              />
              {selectedFile && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative w-32 h-24 rounded-md overflow-hidden border border-gray-600">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Alt Text */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Alt tekst
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Opis slike za pristupačnost"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-900 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Caption */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Caption (opcionalno)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Naslov ispod slike"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-900 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload
              </>
            )}
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      <div
        className={`rounded-md border p-4 sm:p-6 ${
          isDark
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Galerija ({photos.length})
          </h3>
          <button
            onClick={loadPhotos}
            disabled={loading}
            className={`p-2 rounded-md transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""} ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-800" />
          </div>
        ) : photos.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nema slika u galeriji</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`group relative rounded-md overflow-hidden border ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="relative aspect-square">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Delete overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(photo.id)}
                      disabled={deleting === photo.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      {deleting === photo.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {photo.caption && (
                  <div
                    className={`px-2 py-1.5 text-xs truncate ${
                      isDark
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
