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
          className="mb-10 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="mb-12 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-green flex items-center justify-center text-white shadow-3d-green shrink-0">
            <Sparkles size={28} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display text-[32px] sm:text-[40px] text-gray-text lowercase tracking-tight">
              privacy policy
            </h1>
            <p className="text-[13px] font-bold text-gray-nav uppercase tracking-widest mt-1">
              Last updated: April 2026
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="rounded-[24px] border-2 border-border bg-green/5 p-6 mb-10">
          <p className="text-[16px] font-medium text-gray-text leading-relaxed">
            Reflections is a private journaling app. We believe your thoughts belong to you — not to us, not to advertisers, not to anyone else. This policy explains exactly what we collect and why.
          </p>
        </div>

        <div className="space-y-10 text-gray-text">

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue/10 flex items-center justify-center text-blue shrink-0">
                <Database size={20} />
              </div>
              <h2 className="text-[18px] font-black uppercase tracking-widest">What We Collect</h2>
            </div>
            <div className="pl-14 space-y-3 text-[15px] font-medium leading-relaxed text-gray-text">
              <p><strong>Account information:</strong> Your email address and display name, provided when you create an account. Used only for authentication.</p>
              <p><strong>Journal entries:</strong> The text, mood tags, and attachments you write in the app. Stored securely on Supabase (a GDPR-compliant cloud database). We cannot read your journal entries — they are stored under your user account only.</p>
              <p><strong>Usage data:</strong> Anonymous, aggregated counts (e.g., number of notes this month) used to enforce your plan limits. Not linked to individual content.</p>
              <p><strong>Device data:</strong> We do not collect device identifiers, location, contacts, or any sensor data.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green/10 flex items-center justify-center text-green shrink-0">
                <Lock size={20} />
              </div>
              <h2 className="text-[18px] font-black uppercase tracking-widest">How We Use It</h2>
            </div>
            <div className="pl-14 space-y-3 text-[15px] font-medium leading-relaxed text-gray-text">
              <p><strong>To run the app:</strong> Your account data lets you log in and sync your notes across devices.</p>
              <p><strong>AI features:</strong> When you use "AI Reflect", your note content is sent to the Google Gemini API to generate a reflection. This content is not stored by us after the response is returned. Google's API usage is governed by their privacy policy.</p>
              <p><strong>We never:</strong> Sell your data, share it with advertisers, train AI models on your journal content, or use it for any purpose other than running the features you explicitly use.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-golden/10 flex items-center justify-center text-golden shrink-0">
                <Shield size={20} />
              </div>
              <h2 className="text-[18px] font-black uppercase tracking-widest">Data Security</h2>
            </div>
            <div className="pl-14 space-y-3 text-[15px] font-medium leading-relaxed text-gray-text">
              <p>Your data is stored on <strong>Supabase</strong>, which is hosted on AWS and is GDPR-compliant. All data is encrypted in transit (HTTPS) and at rest.</p>
              <p>We use Row-Level Security (RLS) in our database, meaning your notes are only accessible by your own user account — not by other users, and not by us.</p>
              <p>Authentication is handled by Supabase Auth, which follows industry-standard security practices.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red/10 flex items-center justify-center text-red shrink-0">
                <Shield size={20} />
              </div>
              <h2 className="text-[18px] font-black uppercase tracking-widest">Your Rights</h2>
            </div>
            <div className="pl-14 space-y-3 text-[15px] font-medium leading-relaxed text-gray-text">
              <p><strong>Access:</strong> You can view all your data through the app at any time.</p>
              <p><strong>Delete:</strong> You can delete any journal entry from the app. To delete your account and all associated data permanently, contact us at the email below.</p>
              <p><strong>Export:</strong> We are working on a data export feature. Until then, contact us to request your data in a portable format.</p>
              <p>These rights apply to all users, including users in the EU (GDPR) and California (CCPA).</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue/10 flex items-center justify-center text-blue shrink-0">
                <Mail size={20} />
              </div>
              <h2 className="text-[18px] font-black uppercase tracking-widest">Contact</h2>
            </div>
            <div className="pl-14 space-y-3 text-[15px] font-medium leading-relaxed text-gray-text">
              <p>Questions, data deletion requests, or concerns about this policy:</p>
              <a
                href="mailto:privacy@reflections.app"
                className="inline-flex items-center gap-2 text-green font-bold hover:underline"
              >
                <Mail size={16} />
                privacy@reflections.app
              </a>
              <p className="text-[13px] text-gray-nav">
                Reflections is built and maintained by Profit Studio, India.
              </p>
            </div>
          </section>

          {/* Children */}
          <section className="rounded-[24px] border-2 border-border bg-gray-50/50 dark:bg-white/5 p-6">
            <h2 className="text-[14px] font-black uppercase tracking-widest text-gray-nav mb-3">Children's Privacy</h2>
            <p className="text-[14px] font-medium text-gray-text leading-relaxed">
              Reflections is intended for users aged 13 and above. We do not knowingly collect data from children under 13. If you believe a child has created an account, please contact us immediately and we will delete the account.
            </p>
          </section>

          {/* Changes */}
          <section className="rounded-[24px] border-2 border-border bg-gray-50/50 dark:bg-white/5 p-6">
            <h2 className="text-[14px] font-black uppercase tracking-widest text-gray-nav mb-3">Changes to This Policy</h2>
            <p className="text-[14px] font-medium text-gray-text leading-relaxed">
              If we make significant changes, we will notify you within the app before they take effect. The "Last updated" date at the top of this page always reflects the most recent version.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t-2 border-border text-center">
          <p className="text-[12px] font-black text-gray-nav uppercase tracking-widest">
            Reflections — Your thoughts, your sanctuary.
          </p>
        </div>
      </div>
    </div>
  );
};
