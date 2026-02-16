'use client';

import AppHeader from '@/components/app/AppHeader';
import { MessageCircle, Mail, Phone, HelpCircle, FileText, AlertCircle } from 'lucide-react';

export default function SupportPage() {
  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: 'Chat with us on WhatsApp',
      action: 'Open WhatsApp',
      href: 'https://wa.me/1234567890',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@mystatusads.com',
      action: 'Send Email',
      href: 'mailto:support@mystatusads.com',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+91 1234567890',
      action: 'Call Now',
      href: 'tel:+911234567890',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const faqs = [
    {
      question: 'How do I earn money?',
      answer: 'Share advertisements with your network and earn rewards for each verified share.',
    },
    {
      question: 'What is an activation key?',
      answer: 'An activation key unlocks your account and determines your withdrawal limit.',
    },
    {
      question: 'How do withdrawals work?',
      answer: 'Request withdrawals from your wallet. They are processed within 24-48 hours.',
    },
    {
      question: 'How does the referral system work?',
      answer: 'Share your referral code and earn multi-level commissions on your referrals earnings.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Support" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">How can we help?</h1>
          </div>
          <p className="text-slate-400">
            Get in touch with our support team or browse frequently asked questions
          </p>
        </div>

        {/* Contact Options */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Contact Us
          </h3>
          <div className="space-y-3">
            {supportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <a
                  key={option.title}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-emerald-500/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-slate-100 font-semibold mb-1">{option.title}</h4>
                      <p className="text-sm text-slate-400">{option.description}</p>
                    </div>
                    <span className="text-emerald-400 text-sm font-semibold">{option.action}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden group"
              >
                <summary className="p-4 cursor-pointer hover:bg-slate-800/70 transition-colors list-none flex items-center justify-between">
                  <span className="text-slate-100 font-semibold pr-4">{faq.question}</span>
                  <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-slate-100 mb-2">Need more help?</h4>
              <p className="text-slate-400 text-sm mb-4">
                Check out our documentation and guides for detailed information
              </p>
              <div className="flex gap-3">
                <a
                  href="/terms"
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold"
                >
                  Terms of Service
                </a>
                <span className="text-slate-600">•</span>
                <a
                  href="/privacy"
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
