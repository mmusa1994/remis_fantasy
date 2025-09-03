"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCamera, FaTrash } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (photoUrl: string | null) => void;
  className?: string;
}

export default function PhotoUpload({
  currentPhotoUrl,
  onPhotoUpdate,
  className = "",
}: PhotoUploadProps) {
  const { data: session, update } = useSession();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [displayPhotoUrl, setDisplayPhotoUrl] = useState(currentPhotoUrl);

  // Update display URL when prop changes
  useEffect(() => {
    setDisplayPhotoUrl(currentPhotoUrl);
  }, [currentPhotoUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!session?.user?.id) {
      setError("You must be logged in to upload photos");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split("/").pop();
        if (oldPath && oldPath !== fileName) {
          await supabase.storage
            .from("profile-photos")
            .remove([`profile-photos/${oldPath}`]);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;

      // Update profile in database
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar_url: photoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update display URL immediately
      setDisplayPhotoUrl(photoUrl);

      // Force refresh session to update navbar avatar
      await update();

      onPhotoUpdate(photoUrl);
    } catch (err: any) {
      setError(err.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async () => {
    if (!currentPhotoUrl) return;

    setIsUploading(true);
    setError("");

    try {
      // Extract file path from URL
      const fileName = currentPhotoUrl.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("profile-photos")
          .remove([`profile-photos/${fileName}`]);
      }

      // Update profile in database
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar_url: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update display URL immediately
      setDisplayPhotoUrl(undefined);

      // Force refresh session to update navbar avatar
      await update();
      onPhotoUpdate(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Container */}
      <div className="relative group">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${
            displayPhotoUrl ? "bg-transparent" : "bg-red-100 dark:bg-red-900"
          } border-2 ${
            theme === "dark" ? "border-gray-600" : "border-gray-300"
          }`}
        >
          {displayPhotoUrl ? (
            <img
              src={displayPhotoUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <FaCamera className="w-8 h-8 text-red-800 dark:text-red-400" />
          )}
        </div>

        {/* Upload/Edit Overlay */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
            isUploading ? "opacity-100" : ""
          }`}
        >
          {isUploading ? (
            <AiOutlineLoading3Quarters className="w-6 h-6 text-white animate-spin" />
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-red-800 hover:bg-red-900 text-white rounded-full transition-colors"
                title="Upload photo"
              >
                <FaCamera className="w-3 h-3" />
              </button>
              {displayPhotoUrl && (
                <button
                  onClick={deletePhoto}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                  title="Delete photo"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div
        className={`mt-2 text-xs ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <p>Click to upload (max 5MB)</p>
        <p>JPG, PNG, GIF supported</p>
      </div>
    </div>
  );
}
