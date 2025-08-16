import { NextResponse } from "next/server";
import cloudinary from "../../../utils/cloudinary";
import getBase64ImageUrl from "../../../utils/generateBlurPlaceholder";
import type { ImageProps } from "../../../utils/types";

export async function GET() {
  try {
    const results = await cloudinary.v2.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
      .sort_by("created_at", "desc")
      .max_results(400)
      .with_field("context")
      .execute();

    let reducedResults: ImageProps[] = [];

    let i = 0;
    for (let result of results.resources) {
      reducedResults.push({
        id: i,
        height: result.height,
        width: result.width,
        public_id: result.public_id,
        format: result.format,
        guestName: result.context?.guest || "Unknown",
        uploadDate: result.created_at,
      });
      i++;
    }

    const blurImagePromises = results.resources.map((image: ImageProps) => {
      return getBase64ImageUrl(image);
    });
    const imagesWithBlurDataUrls = await Promise.all(blurImagePromises);

    for (let i = 0; i < reducedResults.length; i++) {
      reducedResults[i].blurDataUrl = imagesWithBlurDataUrls[i];
    }

    return NextResponse.json(reducedResults);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}