import cloudinary from "../utils/cloudinary";
import getBase64ImageUrl from "../utils/generateBlurPlaceholder";
import type { ImageProps } from "../utils/types";
import { PhotoModalHandler } from "./PhotoModalHandler";
import { ClientGalleryWrapper } from "@/components/ClientGalleryWrapper";
import { PhotoGallery } from "@/components/PhotoGallery";

async function getImages(): Promise<ImageProps[]> {
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

  return reducedResults;
}

export default async function Home() {
  const images = await getImages();

  return (
    <>
      <PhotoModalHandler images={images} />
      <ClientGalleryWrapper>
        <PhotoGallery initialImages={images} />
      </ClientGalleryWrapper>
    </>
  );
}

