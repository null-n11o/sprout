import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createR2Client, R2_BUCKET, R2_PUBLIC_URL } from "./client";

interface PresignParams {
  childId: string;
  fileName: string;
  contentType: string;
}

interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: Date;
}

export async function getPresignedUploadUrl(
  params: PresignParams
): Promise<PresignResult> {
  const { childId, fileName, contentType } = params;

  // Generate file path: children/{child_id}/{year}/{month}/{filename}
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const timestamp = now.getTime();
  const ext = fileName.split(".").pop() || "jpg";
  const key = `children/${childId}/${year}/${month}/${timestamp}.${ext}`;

  const client = createR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 15 minutes
  const expiresIn = 15 * 60;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    key,
    expiresAt,
  };
}
