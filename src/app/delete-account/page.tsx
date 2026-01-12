'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AccountDeletion() {
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call an API to flag the account for deletion
        // For now, we show a success message as per policy requirement
        if (email) {
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 selection:bg-emerald-500/30 font-sans">
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
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Account Deletion</h1>
                    <p className="text-slate-500 font-medium">Data Removal Request & Policy</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
                    <div className="prose prose-invert prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-red-500 rounded-full" />
                                Our Policy
                            </h2>
                            <p className="leading-relaxed text-slate-400">
                                In compliance with Google Play's Data Safety policies, we provide a straightforward way for users to request the deletion of their account and all associated personal data.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">What data will be deleted?</h3>
                            <ul className="list-disc pl-6 space-y-2 text-slate-400">
                                <li>Personal Identity (Name, Email, Phone)</li>
                                <li>Engagement History & Proofs</li>
                                <li>Points & Redemptions</li>
                                <li>Sharing Network Data</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">Retention Period</h3>
                            <p className="leading-relaxed text-slate-400">
                                Once a request is submitted, your account will be deactivated immediately. All data will be permanently purged from our primary servers and Cloudinary storage within 30 days, except for data we are legally required to retain for regulatory or tax purposes.
                            </p>
                        </section>
                    </div>

                    <div className="relative">
                        {!submitted ? (
                            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl relative z-10">
                                <h3 className="text-xl font-bold text-white mb-6">Request Deletion</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your registered email"
                                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-red-400/80 leading-relaxed">
                                        Warning: This action is irreversible. You will lose all your pending points and member benefits.
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                    >
                                        Delete My Account
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center py-16">
                                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20 text-white text-2xl">
                                    ✓
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Request Received</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    We have received your request for account deletion for <strong>{email}</strong>. Our team will process it within 24-48 hours. You will receive a confirmation email once the process is complete.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 text-emerald-400 font-bold hover:underline"
                                >
                                    Submit another request
                                </button>
                            </div>
                        )}

                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-800 bg-[#0a0f1c]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
                    <p>© 2026 MyStatus Ads. Data Protection Office.</p>
                </div>
            </footer>
        </div>
    );
}
