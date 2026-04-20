import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';
import LoanApplication from '@/models/LoanApplication';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_DOC_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/pdf'
];

const isFile = (value: FormDataEntryValue | null): value is File =>
  typeof value === 'object' && value !== null && 'arrayBuffer' in value;

const sanitizeText = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value.trim() : '';

const uploadToCloudinary = async (file: File, folder: string) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isPdf = file.type === 'application/pdf';

  const uploadResult: any = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? 'raw' : 'image',
        ...(file.type.startsWith('image/') && {
          transformation: [
            { width: 1600, height: 1600, crop: 'limit' },
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

  return uploadResult.secure_url as string;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = sanitizeText(formData.get('name'));
    const contactNumber = sanitizeText(formData.get('contactNumber'));
    const email = sanitizeText(formData.get('email'));
    const loanAmountValue = sanitizeText(formData.get('loanAmount'));
    const pan = sanitizeText(formData.get('pan'));
    const aadhaar = sanitizeText(formData.get('aadhaar'));
    const propertyId = sanitizeText(formData.get('propertyId'));
    const referralCode = sanitizeText(formData.get('referralCode'));
    const loanAmount = Number(loanAmountValue);

    const panCard = formData.get('panCard');
    const aadhaarCard = formData.get('aadhaarCard');
    const bankStatement = formData.get('bankStatement');

    if (!name || !contactNumber || !email || !pan || !aadhaar || !propertyId || !loanAmountValue) {
      return NextResponse.json(
        { success: false, message: 'All personal details are required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid loan amount' },
        { status: 400 }
      );
    }

    if (!propertyId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid property ID format' },
        { status: 400 }
      );
    }

    if (!isFile(panCard) || !isFile(aadhaarCard) || !isFile(bankStatement)) {
      return NextResponse.json(
        { success: false, message: 'All document files are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_DOC_TYPES.includes(panCard.type) || !ALLOWED_DOC_TYPES.includes(aadhaarCard.type)) {
      return NextResponse.json(
        { success: false, message: 'PAN and Aadhaar must be an image or PDF' },
        { status: 400 }
      );
    }

    if (bankStatement.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'Bank statement must be a PDF file' },
        { status: 400 }
      );
    }

    if (panCard.size > MAX_FILE_SIZE || aadhaarCard.size > MAX_FILE_SIZE || bankStatement.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Each document must be 50MB or smaller' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const advertisement = await Advertisement.findById(propertyId);
    if (!advertisement || !advertisement.isActive) {
      return NextResponse.json(
        { success: false, message: 'Property not found or inactive' },
        { status: 404 }
      );
    }

    const [panCardUrl, aadhaarCardUrl, bankStatementUrl] = await Promise.all([
      uploadToCloudinary(panCard, 'loan-documents/pan'),
      uploadToCloudinary(aadhaarCard, 'loan-documents/aadhaar'),
      uploadToCloudinary(bankStatement, 'loan-documents/bank-statement'),
    ]);

    const loanApplication = await LoanApplication.create({
      name,
      contactNumber,
      email: email.toLowerCase(),
      loanAmount,
      pan,
      aadhaar,
      property: propertyId,
      referralCode: referralCode || undefined,
      panCardUrl,
      aadhaarCardUrl,
      bankStatementUrl
    });

    return NextResponse.json({
      success: true,
      message: 'Loan application submitted successfully',
      data: { id: loanApplication._id }
    });
  } catch (error: any) {
    console.error('Create loan application error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
