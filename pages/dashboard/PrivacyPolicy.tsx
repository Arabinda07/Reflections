import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../../types';
import { Sparkle, Shield, Lock, Database, Envelope, ArrowLeft } from '@phosphor-icons/react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-body px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-10 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Back
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-[40px] sm:text-[56px] tracking-tight text-gray-text drop-shadow-sm mb-4">
            Privacy policy
          </h1>
          <p className="text-[13px] font-black uppercase tracking-widest text-gray-nav">
            Last updated: April 16, 2026
          </p>
        </div>

        {/* Intro */}
        <div className="bezel-outer mb-12">
          <div className="bezel-inner p-8">
            <p className="text-[17px] font-medium text-gray-text leading-relaxed">
              Reflections operates on a principle of radical data ownership. We facilitate a high-integrity journaling environment where your thoughts remain your exclusive property. Our governance framework ensures that we do not monetize, share, or exploit your personal reflections.
            </p>
          </div>
        </div>

        <div className="space-y-10 text-gray-text">

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue border border-border shadow-sm">
                <Database size={24} weight="duotone" />
              </div>
              <h2 className="text-[18px] font-display text-gray-text">Data acquisitions</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-light">
              <p><strong className="text-gray-text">Identity:</strong> Email and display name, utilized exclusively for secure authentication and account recovery.</p>
              <p><strong className="text-gray-text">Content:</strong> Notes, mood data, and media attachments. All content is stored on encrypted clusters with Row-Level Security (RLS) ensuring access is restricted to your authenticated session.</p>
              <p><strong className="text-gray-text">Persistence:</strong> Supabase Cloud (GDPR-compliant) manages secure storage for text and binary media without administrative oversight into content records.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-green border border-border shadow-sm">
                <Lock size={24} weight="duotone" />
              </div>
              <h2 className="text-[18px] font-display text-gray-text">Secure synthesis (Ai)</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-light">
              <p><strong className="text-gray-text">Processing:</strong> We leverage Google Gemini for Reflections and Life Wiki synthesis. Data is processed ephemerally; we maintain a zero-retention policy for content handled via these feature ports.</p>
              <p><strong className="text-gray-text">Commitment:</strong> We never train AI models on user data. Your reflections are processed in a secure, non-training environment to generate personal insights requested by you.</p>
              <p><strong className="text-gray-text">Non-Exploitation:</strong> We strictly prohibit data harvesting for advertising or outside monetization. We are your data custodians, not its owners.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-yellow-500 border border-border shadow-sm">
                <Shield size={24} weight="duotone" />
              </div>
              <h2 className="text-[18px] font-display text-gray-text">Security infrastructure</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-light">
              <p>Data residency is maintained on <strong className="text-gray-text">Supabase</strong> (AWS architecture), utilizing industry-standard encryption for data in transit (TLS) and at rest (AES-256).</p>
              <p>Architecture level security is enforced via Row-Level Security (RLS), meaning your entries are cryptographically isolated and inaccessible to any unauthorized entity, including our administrators.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-red border border-border shadow-sm">
                <Shield size={24} weight="fill" />
              </div>
              <h2 className="text-[18px] font-display text-gray-text">Subject rights</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-light">
              <p><strong className="text-gray-text">Autonomy:</strong> You maintain full CRUD (Create, Read, Update, Delete) rights over your data. Account termination results in the immediate and permanent purging of all associated content records.</p>
              <p><strong className="text-gray-text">Portability:</strong> While we finalize automated export tools, data portability requests are handled manually via the contact channel below.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue border border-border shadow-sm">
                <Envelope size={24} weight="duotone" />
              </div>
              <h2 className="text-[18px] font-display text-gray-text">Inquiry channel</h2>
            </div>
            <div className="pl-16 space-y-4 text-[15px] font-medium leading-relaxed text-gray-light">
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
          <section className="bezel-outer">
            <div className="bezel-inner p-8">
              <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-nav mb-4">Governance & policy updates</h2>
              <p className="text-[14px] font-medium text-gray-text leading-relaxed">
                Reflections is designed for individuals aged 13 and above. If we implement significant changes to this framework, we will provide advanced notice via the application interface. This document remains the definitive standard for our data relationship.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center">
        </div>
      </div>
    </div>
  );
};

