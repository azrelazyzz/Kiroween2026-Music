import { NextResponse } from "next/server";

import type { ApiFailure } from "@/lib/domain/types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json<ApiFailure>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Choose a JPEG, PNG, or WebP cover photo.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json<ApiFailure>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            "The image must be JPEG, PNG, or WebP and no larger than 8 MB.",
          retryable: false,
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json<ApiFailure>(
    {
      error: {
        code: "VISION_NOT_CONFIGURED",
        message:
          "Photo clue extraction is not enabled in this MVP deployment. Use barcode or detailed search instead.",
        retryable: false,
      },
    },
    { status: 501 },
  );
}
