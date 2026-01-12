import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateRequest } from '@/middleware/auth';

// Configure Cloudinary
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

        const { params_to_sign } = await request.json();

        if (!params_to_sign) {
            return NextResponse.json(
                { success: false, message: 'Missing parameters to sign' },
                { status: 400 }
            );
        }

        const signature = cloudinary.utils.api_sign_request(
            params_to_sign,
            process.env.CLOUDINARY_API_SECRET!
        );

        return NextResponse.json({
            success: true,
            data: {
                signature,
                api_key: process.env.CLOUDINARY_API_KEY,
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME
            }
        });

    } catch (error: any) {
        console.error('Signature generation error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to generate signature', error: error.message },
            { status: 500 }
        );
    }
}
