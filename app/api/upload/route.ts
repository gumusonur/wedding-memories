import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../../utils/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const { file, guestName } = await request.json();

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const uploadRes = await cloudinary.v2.uploader.upload(file, {
      folder: process.env.CLOUDINARY_FOLDER,
      context: { guest: guestName || "anonymous" },
    });

    return NextResponse.json(uploadRes, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}