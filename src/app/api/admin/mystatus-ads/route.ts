import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MyStatusAd from '@/models/MyStatusAd';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const mystatusAds = await MyStatusAd.find({})
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      mystatusAds: mystatusAds.map(ad => ({
        _id: ad._id,
        title: ad.title,
        description: ad.description,
        image: ad.image,
        category: ad.category,
        isActive: ad.isActive,
        totalShares: ad.totalShares,
        createdAt: ad.createdAt,
      }))
    });

  } catch (error: any) {
    console.error('Get MyStatus ads error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request, ['admin']);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    await connectToDatabase();

    const { title, description, image, category } = await request.json();

    if (!title || !description || !image || !category) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['motivation', 'inspiration', 'success', 'mindset', 'goals', 'positivity'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category selected' },
        { status: 400 }
      );
    }

    const mystatusAd = await MyStatusAd.create({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      category,
    });

    return NextResponse.json({
      success: true,
      message: 'MyStatus ad created successfully',
      mystatusAd: {
        _id: mystatusAd._id,
        title: mystatusAd.title,
        description: mystatusAd.description,
        image: mystatusAd.image,
        category: mystatusAd.category,
        isActive: mystatusAd.isActive,
        totalShares: mystatusAd.totalShares,
        createdAt: mystatusAd.createdAt,
      }
    });

  } catch (error: any) {
    console.error('Create MyStatus ad error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Duplicate entry found' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
