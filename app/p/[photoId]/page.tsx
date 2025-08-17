import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Carousel from "../../../components/Carousel";
import getResults from "../../../utils/cachedImages";
import cloudinary from "../../../utils/cloudinary";
import getBase64ImageUrl from "../../../utils/generateBlurPlaceholder";
import type { ImageProps } from "../../../utils/types";

interface PageProps {
  params: Promise<{
    photoId: string;
  }>;
}

async function getPhoto(photoId: string): Promise<ImageProps | null> {
  const results = await getResults();

  const reducedResults: ImageProps[] = [];
  let i = 0;
  for (const result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
    });
    i++;
  }

  const currentPhoto = reducedResults.find(
    (img) => img.id === Number(photoId),
  );

  if (!currentPhoto) return null;

  currentPhoto.blurDataUrl = await getBase64ImageUrl(currentPhoto);
  return currentPhoto;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { photoId } = await params;
  const currentPhoto = await getPhoto(photoId);
  
  if (!currentPhoto) {
    return {
      title: "Photo not found",
    };
  }

  const currentPhotoUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_2560/${currentPhoto.public_id}.${currentPhoto.format}`;

  return {
    title: `${process.env.NEXT_PUBLIC_GROOM_NAME} & ${process.env.NEXT_PUBLIC_BRIDE_NAME} Wedding Memories`,
    openGraph: {
      title: `${process.env.NEXT_PUBLIC_GROOM_NAME} & ${process.env.NEXT_PUBLIC_BRIDE_NAME} Wedding Memories`,
      description: "Beautiful wedding memories captured in time.",
      images: [currentPhotoUrl],
    },
    twitter: {
      title: `${process.env.NEXT_PUBLIC_GROOM_NAME} & ${process.env.NEXT_PUBLIC_BRIDE_NAME} Wedding Memories`,
      description: "Beautiful wedding memories captured in time.",
      images: [currentPhotoUrl],
    },
  };
}

export default async function PhotoPage({ params }: PageProps) {
  const { photoId } = await params;
  const currentPhoto = await getPhoto(photoId);
  
  if (!currentPhoto) {
    notFound();
  }

  const index = Number(photoId);

  return (
    <main className="mx-auto max-w-[1960px] p-4">
      <Carousel currentPhoto={currentPhoto} index={index} />
    </main>
  );
}

export async function generateStaticParams() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by("public_id", "desc")
    .max_results(400)
    .execute();

  return results.resources.map((_: any, i: number) => ({
    photoId: i.toString(),
  }));
}