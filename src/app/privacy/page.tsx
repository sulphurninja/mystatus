'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
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
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-slate-500 font-medium">Last Updated: January 13, 2026</p>
                </div>

                <div className="prose prose-invert prose-slate max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            1. Introduction
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            Welcome to MyStatus Ads. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our mobile application (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            2. Data We Collect
                        </h2>
                        <p className="leading-relaxed text-slate-400 mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-3 text-slate-400">
                            <li><strong>Identity Data:</strong> includes first name, last name, and username.</li>
                            <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                            <li><strong>Technical Data:</strong> includes IP address, login data, browser type and version, and device information.</li>
                            <li><strong>Proof Data:</strong> includes screen recordings or images provided by you to verify advertisement sharing. This data is securely stored on Cloudinary.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            3. How Your Data is Used
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            We use your data only to provide and improve our services. Specifically:
                            - To register you as a new user.
                            - To process and verify your engagement points based on the proof media you submit.
                            - To manage our relationship with you including notifying you about new reward offers or changes to our terms.
                            - To detect and prevent fraud.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            4. Media Storage (Cloudinary)
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            Your proof images and videos are uploaded directly to Cloudinary, a third-party media management service. By using our service, you acknowledge that your media will be stored on Cloudinary's secure servers for the purpose of verification and quality control.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            5. Your Rights & Data Deletion
                        </h2>
                        <p className="leading-relaxed text-slate-400 mb-6">
                            You have the right to access, correct, or delete your personal data. If you wish to delete your account and all associated data, you can do so through the "Delete Account" option in the mobile app settings or by visiting our <Link href="/delete-account" className="text-emerald-400 hover:underline">Account Deletion page</Link>.
                        </p>
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <p className="text-sm font-medium text-emerald-400">
                                Note: Once an account is deleted, your platform rewards, engagement history, and proof media will be permanently removed and cannot be recovered.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            6. Contact Us
                        </h2>
                        <p className="leading-relaxed text-slate-400">
                            If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:privacy@mystatusads.com" className="text-emerald-400 hover:underline">privacy@mystatusads.com</a>
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-800 bg-[#0a0f1c]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-slate-500">© 2026 MyStatus Ads. Professional Crowdsourced Marketing.</p>
                </div>
            </footer>
        </div>
    );
}
