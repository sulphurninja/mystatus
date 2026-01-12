'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 selection:bg-emerald-500/30 font-sans">
            {/* Simple Header */}
            {/* Standardized Header */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-slate-700/50">
                            <span className="text-slate-900 font-bold text-xl">MS</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            MyStatus
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Terms of Service</h1>
                    <p className="text-slate-500 font-medium">Last Updated: January 13, 2026</p>
                </div>

                <div className="prose prose-invert prose-slate max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            1. Agreement to Terms
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            By accessing or using MyStatus Ads, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            2. User Accounts
                        </h2>
                        <p className="leading-relaxed text-slate-400 mb-4">
                            To use our mobile application, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>
                        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                            <p className="text-sm font-medium text-slate-200">
                                Multiple accounts: Generating multiple accounts to manipulate the referral network or reward mechanism is strictly prohibited and will result in permanent ban and forfeiture of points.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            3. Verification & Points
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            Points and rewards are credited only after the submitted proof (images or videos) is manually verified by our team. We reserve the right to reject any proof that:
                            - Is low quality or illegible.
                            - Is forged or manipulated.
                            - Shows the status was deleted immediately after sharing.
                            - Does not meet the specific requirements of the advertisement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            4. Prohibited Content
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            When using our sharing tools, you must not post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. We reserve the right to terminate accounts that use our platform to spread malware or spam.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            5. Account Deletion
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            Users can request account deletion at any time through the mobile app. Upon deletion, all data including platform points and benefits will be permanently removed as per our <Link href="/delete-account" className="text-emerald-400 hover:underline">Account Deletion Policy</Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            6. Limitation of Liability
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            MyStatus Ads shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-800 bg-[#0a0f1c]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-slate-500">© 2026 MyStatus Ads. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
