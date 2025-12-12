import connectToDatabase from '../lib/mongodb';
import MyStatusAd from '../models/MyStatusAd';

const sampleAds = [
  {
    title: "Believe in Yourself",
    description: "Every expert was once a beginner. Every champion was once a contender. Believe in yourself and your journey will unfold beautifully.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    category: "motivation"
  },
  {
    title: "Small Steps Lead to Big Changes",
    description: "Don't underestimate the power of small daily improvements. Consistency compounds over time and leads to extraordinary results.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=400&h=300&fit=crop",
    category: "motivation"
  },
  {
    title: "Embrace Challenges",
    description: "The greatest glory in living lies not in never falling, but in rising every time we fall. Challenges make us stronger.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    category: "inspiration"
  },
  {
    title: "Dream Big, Start Small",
    description: "Your dreams don't have to be realistic. They just have to be possible. Start with one small step today.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=400&h=300&fit=crop",
    category: "goals"
  },
  {
    title: "Mindset is Everything",
    description: "The way you think determines the way you feel, and the way you feel determines the way you act. Choose your thoughts wisely.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    category: "mindset"
  },
  {
    title: "Success is a Journey",
    description: "Success is not final, failure is not fatal: It is the courage to continue that counts. Keep moving forward.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=400&h=300&fit=crop",
    category: "success"
  },
  {
    title: "Spread Positivity",
    description: "Your words and actions have the power to inspire others. Choose kindness and watch the world become brighter.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    category: "positivity"
  },
  {
    title: "Never Stop Learning",
    description: "The day you stop learning is the day you start dying. Keep your mind curious and your heart open to new possibilities.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6f44d?w=400&h=300&fit=crop",
    category: "inspiration"
  }
];

async function seedMyStatusAds() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Clear existing ads
    await MyStatusAd.deleteMany({});
    console.log('Cleared existing MyStatus ads');

    // Insert sample ads
    const createdAds = await MyStatusAd.insertMany(sampleAds);
    console.log(`Created ${createdAds.length} MyStatus ads`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding MyStatus ads:', error);
    process.exit(1);
  }
}

seedMyStatusAds();


