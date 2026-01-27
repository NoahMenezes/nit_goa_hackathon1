// Enhanced Upload API - Supports both Cloudinary and Supabase Storage
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILES_PER_REQUEST = 5;

// Validate file
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file name
  if (file.name.length > 255) {
    return {
      valid: false,
      error: "File name is too long (max 255 characters)",
    };
  }

  return { valid: true };
}

// Upload to Cloudinary
async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary is not configured");
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataURI = `data:${file.type};base64,${base64}`;

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", dataURI);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "ourstreet");
  formData.append("resource_type", "image");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudinary upload failed:", errorText);
    throw new Error("Failed to upload to Cloudinary");
  }

  const data = await response.json();
  return data.secure_url;
}

// Upload to Supabase Storage
async function uploadToSupabase(file: File, userId: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Generate unique file name
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from("issue-photos")
    .upload(fileName, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("issue-photos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// Main upload handler
export async function POST(request: NextRequest) {
  try {
    // Verify authentication (allow guest uploads for demo)
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    let userId = "guest-" + Date.now();

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    // Check maximum number of files
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per request`,
        },
        { status: 400 },
      );
    }

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!(file instanceof File)) {
        errors.push(`Item ${i + 1} is not a valid file`);
        continue;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`File "${file.name}": ${validation.error}`);
        continue;
      }

      try {
        let uploadedUrl: string;

        // Try Cloudinary first, fall back to Supabase
        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
          uploadedUrl = await uploadToCloudinary(file);
        } else if (SUPABASE_URL && SUPABASE_ANON_KEY) {
          uploadedUrl = await uploadToSupabase(file, userId);
        } else {
          throw new Error(
            "No storage provider configured. Please set up Cloudinary or Supabase Storage.",
          );
        }

        uploadedUrls.push(uploadedUrl);
      } catch (uploadError) {
        console.error(`Error uploading file "${file.name}":`, uploadError);
        errors.push(
          `File "${file.name}": ${uploadError instanceof Error ? uploadError.message : "Upload failed"}`,
        );
      }
    }

    // Check if any files were uploaded successfully
    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload any files",
          details: errors.length > 0 ? errors : undefined,
        },
        { status: 500 },
      );
    }

    // Return response
    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0], // For backward compatibility
      message: `Successfully uploaded ${uploadedUrls.length} file(s)`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload files. Please try again.",
      },
      { status: 500 },
    );
  }
}

// GET /api/upload - Check upload configuration
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    // Check configuration
    const cloudinaryConfigured = !!(
      CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET
    );
    const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

    return NextResponse.json({
      success: true,
      data: {
        provider: cloudinaryConfigured
          ? "cloudinary"
          : supabaseConfigured
            ? "supabase"
            : "none",
        cloudinaryConfigured,
        supabaseConfigured,
        maxFileSize: MAX_FILE_SIZE,
        maxFiles: MAX_FILES_PER_REQUEST,
        allowedTypes: ALLOWED_MIME_TYPES,
      },
    });
  } catch (error) {
    console.error("Upload config check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check upload configuration" },
      { status: 500 },
    );
  }
}
