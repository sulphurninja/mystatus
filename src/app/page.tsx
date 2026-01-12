'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is MyStatus Ads?",
      a: "MyStatus Ads is a lifestyle reward platform that bridges the gap between active social media users and growing brands. By sharing curated content, users unlock exclusive benefits and redeemable rewards."
    },
    {
      q: "How do I claim my rewards?",
      a: "Simply share the advertisement on your status, wait for our verification team to confirm the engagement, and points will be credited to your internal vault. These can be redeemed for various platform offers."
    },
    {
      q: "Is it free to join?",
      a: "Yes! Registration is open to everyone. You just need an invitation code to get started with our community."
    },
    {
      q: "What kind of rewards can I get?",
      a: "Our reward catalog includes premium service unlocks, exclusive brand vouchers, and lifestyle offers tailored to our active community members."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-emerald-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-slate-700/50">
              <Image src="/mystatus.jpeg" alt="MyStatus" width={40} height={40} className="object-cover" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              MyStatus
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
            <a href="#app" className="hover:text-emerald-400 transition-colors">Mobile App</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
            <a href="#footer" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://mystatusads.com/download/mystatus.apk"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Get App
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] -ml-48 -mb-48" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Trusted by 10,000+ Community Members
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white leading-[1.1] mb-8 tracking-tight">
              Unlock <span className="text-emerald-400">Exclusive Rewards</span> Through Your Influence.
            </h1>
            <p className="text-lg md:text-2xl text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto">
              Transform your daily social presence into a gateway for premium offers. Connect with brands you love and get rewarded for every status share.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="https://mystatusads.com/download/mystatus.apk" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-3">
                Download for Android <span className="text-2xl">→</span>
              </a>
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <div className="text-left">
                  <p className="text-white font-bold leading-none mb-1">Platinum Tier</p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Available Rewards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us / Mission */}
      <section id="about" className="py-24 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-[4rem] flex items-center justify-center overflow-hidden border border-emerald-500/20">
                <Image src="/mystatus.jpeg" alt="MyStatus Platform" width={400} height={400} className="rounded-3xl shadow-2xl scale-110" />
              </div>
              <div className="absolute -bottom-10 -right-10 p-8 rounded-3xl bg-[#0f172a] border border-slate-700 shadow-2xl">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 text-slate-900 font-black text-xl">✓</div>
                <p className="text-white font-bold text-lg leading-tight">Verified<br />Engagement</p>
              </div>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">Bridging Brands & <br /><span className="text-emerald-400">Social Influence.</span></h2>
              <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                Our mission is to democratize digital marketing by rewarding the very people who drive engagement. We provide a transparent, secure environment where your influence is valued and converted into exciting lifestyle rewards.
              </p>
              <ul className="space-y-6">
                {[
                  { t: "Discovery", d: "Find curated branded content that matches your style." },
                  { t: "Engagement", d: "Share the content directly to your status with one tap." },
                  { t: "Redemption", d: "Unblock premium offers and exclusive member benefits." }
                ].map((step, i) => (
                  <li key={i} className="flex gap-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-xl mb-1">{step.t}</h4>
                      <p className="text-slate-500">{step.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Showcase */}
      <section id="app" className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Experience Better on Mobile.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              The MyStatus mobile app is your command center for managing rewards, tracking impact, and discovering new brand offers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Real-time Tracking", desc: "Monitor your status views and engagement points instantly.", icon: "📊" },
              { title: "One-Tap Sharing", desc: "Seamlessly share branded content to WhatsApp directly from the app.", icon: "📲" },
              { title: "Secure Wallet", desc: "Manage your reward points and redemption history safely.", icon: "🔒" }
            ].map((feature, i) => (
              <div key={i} className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a
              href="https://mystatusads.com/download/mystatus.apk"
              className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
            >
              <span>Download .APK</span>
              <span className="text-xs font-normal bg-slate-200 px-2 py-1 rounded">v1.2.4</span>
            </a>
            <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest">Secure • Verified • Fast</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#0a0f1c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Premium Features.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed italic">&quot;Designed for scale, built for the community.&quot;</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Secure Vault', desc: 'Your rewards are protected with enterprise-grade security and transparent tracking.', icon: '🛡️' },
              { title: 'Smart Verification', desc: 'Our unique proof-of-status system ensures every engagement is authentic.', icon: '⚡' },
              { title: 'Instant Unlocks', desc: 'Redeem your accumulated points for exciting offers directly within the app.', icon: '🔓' },
              { title: 'Partner Network', desc: 'Access a growing ecosystem of brands offering exclusive community perks.', icon: '🤝' },
              { title: 'Referral Tiers', desc: 'Grow your network and share the benefits with friends through our tiered system.', icon: '📈' },
              { title: 'Cloud Media', desc: 'Seamless media management powered by high-speed global delivery networks.', icon: '☁️' }
            ].map((feature, i) => (
              <div key={i} className="group p-10 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all hover:-translate-y-2 text-left">
                <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-white text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-xl font-bold text-slate-200">{faq.q}</span>
                  <span className={`text-2xl transition-transform duration-300 ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {activeFaq === i && (
                  <div className="p-6 pt-0 text-slate-400 leading-relaxed text-lg border-t border-slate-800/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-20 border-t border-slate-800 bg-[#0f172a] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                  <Image src="/mystatus.jpeg" alt="MyStatus" width={32} height={32} className="object-cover rounded-md" />
                </div>
                <span className="text-2xl font-bold text-white uppercase tracking-tighter">MyStatus</span>
              </div>
              <p className="text-slate-400 max-w-sm text-lg leading-relaxed">The premier choice for status-based engagement rewards. Join thousands of creators getting recognized for their influence.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 text-lg uppercase tracking-widest text-slate-500">Legal</h4>
              <ul className="space-y-4 text-slate-400">
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/delete-account" className="hover:text-emerald-400 transition-colors">Data Deletion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 text-lg uppercase tracking-widest text-slate-500">Support</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="mailto:support@mystatusads.com" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><Link href="/admin/login" className="hover:text-emerald-400 transition-colors">Partner Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-800/50 flex flex-col md:row items-center justify-between gap-6 text-sm text-slate-500 font-bold tracking-widest uppercase">
            <p>© 2026 MyStatus Ads. Professional Community Platform.</p>
            <div className="flex items-center gap-10">
              <span className="flex items-center gap-2 underline underline-offset-8 decoration-emerald-500/50">Verified by Cloud Protection</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span>Version 1.2.4</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px] -mr-96 -mb-48" />
      </footer>
    </div>
  );
}
