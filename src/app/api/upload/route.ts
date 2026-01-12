import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateRequest } from '@/middleware/auth';

// Configure Cloudinary
// Required environment variables:
// CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name
// CLOUDINARY_API_KEY - Your Cloudinary API key
// CLOUDINARY_API_SECRET - Your Cloudinary API secret
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin', 'user']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Supported: JPEG, PNG, WebP, and MP4/QuickTime videos.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'mystatus-proofs',
          resource_type: 'auto',
          // Only apply transformations to images
          ...(file.type.startsWith('image/') && {
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' }
            ]
          })
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed', error: error.message },
      { status: 500 }
    );
  }
}
