import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/mongodb';
import Advertisement from '@/models/Advertisement';

interface Props {
  params: Promise<{ id: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mystatusads.com';
const defaultOgImage = new URL('/mystatus.jpeg', siteUrl).toString();

const toAbsoluteUrl = (url?: string) => {
  if (!url) return defaultOgImage;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return new URL(url, siteUrl).toString();
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    await connectToDatabase();
    
    const advertisement = await Advertisement.findById(id)
      .populate('vendor', 'name');
    
    if (!advertisement || !advertisement.isActive) {
      return {
        title: 'Advertisement Not Found',
        description: 'This advertisement is no longer available.',
      };
    }
    
    const imageUrl = toAbsoluteUrl(advertisement.image);
    const shareUrl = new URL(`/s/${id}`, siteUrl).toString();
    
    return {
      title: advertisement.title,
      description: advertisement.description || advertisement.title,
      openGraph: {
        title: advertisement.title,
        description: advertisement.description || advertisement.title,
        images: [
          {
            url: imageUrl,
            alt: advertisement.title,
          },
        ],
        type: 'website',
        url: shareUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: advertisement.title,
        description: advertisement.description || advertisement.title,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Advertisement',
      description: 'View this advertisement on MyStatus',
    };
  }
}

export default async function ShareableAdPage({ params }: Props) {
  const { id } = await params;
  
  try {
    await connectToDatabase();
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      notFound();
    }
    
    const advertisement = await Advertisement.findById(id)
      .populate('vendor', 'name');
    
    if (!advertisement || !advertisement.isActive) {
      notFound();
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="glass-card rounded-2xl overflow-hidden">
            {advertisement.image && (
              <div className="w-full aspect-video bg-slate-950">
                <img
                  src={advertisement.image}
                  alt={advertisement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-white mb-4">
                {advertisement.title}
              </h1>
              {advertisement.description && (
                <p className="text-slate-300 text-lg mb-6">
                  {advertisement.description}
                </p>
              )}
              {advertisement.vendor && (
                <p className="text-slate-400 text-sm mb-4">
                  By {advertisement.vendor.name}
                </p>
              )}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-xl">
                    💰 {advertisement.rewardAmount}
                  </span>
                  <span className="text-slate-400 text-sm">Reward</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-emerald-400 text-sm font-medium text-center">
                  📲 Download MyStatus app to earn rewards by sharing advertisements!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading advertisement:', error);
    notFound();
  }
}
