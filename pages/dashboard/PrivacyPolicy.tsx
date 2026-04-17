import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../../types';
import { Sparkles, Shield, Lock, Database, Mail, ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-10 flex items-center gap-2 text-[12px] font-black text-gray-nav hover:text-green transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-[40px] sm:text-[56px] tracking-tight bg-gradient-to-r from-green via-blue to-green bg-clip-text text-transparent animate-gradient-x drop-shadow-sm">
            Privacy policy
          </h1>
          <p className="text-[11px] font-black text-gray-nav mt-2">
            Last updated: April 16, 2026
          </p>
        </div>

        {/* Intro */}
        <div className="rounded-[32px] border-2 border-border bg-gray-50/30 dark:bg-white/5 p-8 mb-12">
          <p className="text-[17px] font-medium text-gray-text leading-relaxed">
            Reflections operates on a principle of radical data ownership. We facilitate a high-integrity journaling environment where your thoughts remain your exclusive property. Our governance framework ensures that we do not monetize, share, or exploit your personal reflections.
          </p>
        </div>

        <div className="space-y-10 text-gray-text">

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-blue border-2 border-border shadow-sm dark:bg-zinc-800">
                <Database size={20} />
              </div>
              <h2 className="text-[14px] font-black text-gray-nav">Data acquisitions</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-text">
              <p><strong>Identity:</strong> Email and display name, utilized exclusively for secure authentication and account recovery.</p>
              <p><strong>Content:</strong> Notes, mood data, and media attachments. All content is stored on encrypted clusters with Row-Level Security (RLS) ensuring access is restricted to your authenticated session.</p>
              <p><strong>Persistence:</strong> Supabase Cloud (GDPR-compliant) manages secure storage for text and binary media without administrative oversight into content records.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-green border-2 border-border shadow-sm dark:bg-zinc-800">
                <Lock size={20} />
              </div>
              <h2 className="text-[14px] font-black text-gray-nav">Secure synthesis (Ai)</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-text">
              <p><strong>Processing:</strong> We leverage Google Gemini for Reflections and Life Wiki synthesis. Data is processed ephemerally; we maintain a zero-retention policy for content handled via these feature ports.</p>
              <p><strong>Commitment:</strong> We never train AI models on user data. Your reflections are processed in a secure, non-training environment to generate personal insights requested by you.</p>
              <p><strong>Non-Exploitation:</strong> We strictly prohibit data harvesting for advertising or outside monetization. We are your data custodians, not its owners.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-golden border-2 border-border shadow-sm dark:bg-zinc-800">
                <Shield size={20} />
              </div>
              <h2 className="text-[14px] font-black text-gray-nav">Security infrastructure</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-text">
              <p>Data residency is maintained on <strong>Supabase</strong> (AWS architecture), utilizing industry-standard encryption for data in transit (TLS) and at rest (AES-256).</p>
              <p>Architecture level security is enforced via Row-Level Security (RLS), meaning your entries are cryptographically isolated and inaccessible to any unauthorized entity, including our administrators.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-red border-2 border-border shadow-sm dark:bg-zinc-800">
                <Shield size={20} />
              </div>
              <h2 className="text-[14px] font-black text-gray-nav">Subject rights</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-text">
              <p><strong>Autonomy:</strong> You maintain full CRUD (Create, Read, Update, Delete) rights over your data. Account termination results in the immediate and permanent purging of all associated content records.</p>
              <p><strong>Portability:</strong> While we finalize automated export tools, data portability requests are handled manually via the contact channel below.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-blue border-2 border-border shadow-sm dark:bg-zinc-800">
                <Mail size={20} />
              </div>
              <h2 className="text-[14px] font-black text-gray-nav">Inquiry channel</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-text">
              <p>Directed inquiries regarding this governance framework or data deletion protocols may be submitted to:</p>
              <a
                href="mailto:robinsaha@gmail.com"
                className="inline-flex items-center gap-2 text-green font-bold hover:underline tracking-tight"
              >
                robinsaha@gmail.com
              </a>
            </div>
          </section>

          {/* Governance Footer */}
          <section className="rounded-[32px] border-2 border-border bg-gray-50/50 dark:bg-white/5 p-8">
            <h2 className="text-[12px] font-black text-gray-nav mb-4">Governance & policy updates</h2>
            <p className="text-[14px] font-medium text-gray-text leading-relaxed">
              Reflections is designed for individuals aged 13 and above. If we implement significant changes to this framework, we will provide advanced notice via the application interface. This document remains the definitive standard for our data relationship.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t-2 border-border text-center">
        </div>
      </div>
    </div>
  );
};
