import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Config = {
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
};

export const r2Client = new S3Client(r2Config);

export const BUCKETS = {
  PRIVATE: process.env.CLOUDFLARE_R2_PRIVATE_BUCKET!,
  PUBLIC: process.env.CLOUDFLARE_R2_PUBLIC_BUCKET!,
} as const;

export type BucketType = keyof typeof BUCKETS;

export interface UploadParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  etag: string;
  bucket: string;
  url?: string;
}

export async function uploadFile(
  bucket: BucketType,
  params: UploadParams,
): Promise<UploadResult> {
  const bucketName = BUCKETS[bucket];

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    Metadata: params.metadata,
  });

  const response = await r2Client.send(command);

  const result: UploadResult = {
    key: params.key,
    etag: response.ETag!,
    bucket: bucketName,
  };

  if (bucket === "PUBLIC") {
    result.url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${params.key}`;
  }

  return result;
}

export async function downloadFile(
  bucket: BucketType,
  key: string,
): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKETS[bucket],
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  return Buffer.from(await response.Body.transformToByteArray());
}

export async function deleteFile(
  bucket: BucketType,
  key: string,
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKETS[bucket],
    Key: key,
  });

  await r2Client.send(command);
}

export async function listFiles(
  bucket: BucketType,
  prefix?: string,
  maxKeys?: number,
) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKETS[bucket],
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await r2Client.send(command);
  return response.Contents || [];
}

export async function getPresignedUrl(
  bucket: BucketType,
  key: string,
  operation: "get" | "put" = "get",
  expiresIn = 3600,
): Promise<string> {
  const bucketName = BUCKETS[bucket];

  const command =
    operation === "get"
      ? new GetObjectCommand({ Bucket: bucketName, Key: key })
      : new PutObjectCommand({ Bucket: bucketName, Key: key });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getPresignedUploadUrl(
  bucket: BucketType,
  key: string,
  contentType?: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKETS[bucket],
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function fileExists(
  bucket: BucketType,
  key: string,
): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKETS[bucket],
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(key: string): string {
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

export function generateKey(
  prefix: string,
  filename: string,
  userId?: string,
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  if (userId) {
    return `${prefix}/${userId}/${timestamp}-${random}-${filename}`;
  }

  return `${prefix}/${timestamp}-${random}-${filename}`;
}

export const R2_PREFIXES = {
  DESIGNS: "designs",
  MOCKUPS: "mockups",
  PRINT_FILES: "print-files",
  TEMPLATES: "templates",
  USER_UPLOADS: "uploads",
  PRODUCT_IMAGES: "products",
  MARKETING: "marketing",
} as const;

export type R2Prefix = (typeof R2_PREFIXES)[keyof typeof R2_PREFIXES];
