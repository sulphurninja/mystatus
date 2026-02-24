import { Metadata } from 'next';
import ReferralLandingClient from './ReferralLandingClient';

interface Props {
  params: Promise<{ code: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mystatusads.com';
const defaultOgImage = new URL('/mystatus.jpeg', siteUrl).toString();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  
  return {
    title: `Join MyStatus - Referral: ${code}`,
    description: 'Join MyStatus and start earning by sharing advertisements! Download the app now and use this referral code to get started.',
    openGraph: {
      title: `Join MyStatus with code ${code}`,
      description: 'Join MyStatus and start earning by sharing advertisements! Download the app now.',
      type: 'website',
      url: new URL(`/r/${code}`, siteUrl).toString(),
      siteName: 'MyStatus',
      images: [
        {
          url: defaultOgImage,
          alt: 'MyStatus',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Join MyStatus with code ${code}`,
      description: 'Join MyStatus and start earning by sharing advertisements! Download the app now.',
      images: [defaultOgImage],
    },
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;
  return <ReferralLandingClient referralCode={code} />;
}



