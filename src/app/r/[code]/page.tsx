import { Metadata } from 'next';
import ReferralLandingClient from './ReferralLandingClient';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  
  return {
    title: `Join MyStatus - Referral: ${code}`,
    description: 'Join MyStatus and start earning by sharing advertisements! Download the app now and use this referral code to get started.',
    openGraph: {
      title: `Join MyStatus with code ${code}`,
      description: 'Join MyStatus and start earning by sharing advertisements! Download the app now.',
      type: 'website',
    },
  };
}

export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;
  return <ReferralLandingClient referralCode={code} />;
}



