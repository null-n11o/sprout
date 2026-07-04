import { NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";
import { requireUser, jsonError } from "@/lib/api/route-helpers";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

export async function POST(request: Request) {
  try {
    // Check authentication
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { supabase } = auth;

    // Parse request body
    const body = await request.json();
    const { childId, fileName, contentType } = body;

    // Validate required fields
    if (!childId || !fileName || !contentType) {
      return jsonError("Missing required fields: childId, fileName, contentType", 400);
    }

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return jsonError(`Invalid content type. Allowed: ${ALLOWED_TYPES.join(", ")}`, 400);
    }

    // Verify child exists
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .single();

    if (childError || !child) {
      return jsonError("Child not found", 404);
    }

    // Generate presigned URL
    const result = await getPresignedUploadUrl({
      childId,
      fileName,
      contentType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Presign error:", error);
    return jsonError("Failed to generate upload URL", 500);
  }
}
