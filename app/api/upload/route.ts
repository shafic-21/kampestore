// /app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  uploadFile,
  generateKey,
  R2_PREFIXES,
  type BucketType,
} from "@/lib/r2";

interface UploadResponse {
  success: boolean;
  data?: {
    key: string;
    url?: string;
    metadata: {
      fileName: string;
      fileSize: number;
      contentType: string;
      uploadedAt: string;
    };
  };
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

export async function POST(
  request: NextRequest,
): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as BucketType) || "PRIVATE";
    const prefix =
      (formData.get("prefix") as keyof typeof R2_PREFIXES) || "USER_UPLOADS";
    const userId = formData.get("userId") as string;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Generate unique key
    const key = generateKey(R2_PREFIXES[prefix], file.name, userId);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const result = await uploadFile(bucket, {
      key,
      body: buffer,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: userId || "anonymous",
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        key: result.key,
        url: result.url,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
      },
      { status: 500 },
    );
  }
}
