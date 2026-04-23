import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkle, Shield, Lock, Database, Envelope, ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';

const sections = [
  {
    icon: <Database size={22} weight="duotone" />,
    title: 'What we keep',
    tone: 'green',
    body: [
      'We save your email address and any profile details you share.',
      'Your reflections—including notes, moods, and attachments—are tied securely to your account.',
      'Everything is stored using professional-grade security (Supabase RLS), meaning only you can access your data.',
    ],
  },
  {
    icon: <Lock size={22} weight="duotone" />,
    title: 'How AI works here',
    tone: 'green',
    body: [
      'AI features only run when you explicitly ask for them, like when you want a summary or a prompt.',
      'We do not use your personal notes to train AI models. Your thoughts are yours, not training data.',
      'Any insights generated are private to you. We don\'t use them for marketing or tracking.',
    ],
  },
  {
    icon: <Shield size={22} weight="duotone" />,
    title: 'Security',
    tone: 'green',
    body: [
      'Your data is encrypted while it moves and while it sits in our database.',
      'We use "Row Level Security," which is a technical way of saying your notes are locked to your specific login.',
      'As the app grows, we\'ll keep improving our privacy tools. We will always be clear about what we can and can\'t do.',
    ],
  },
  {
    icon: <Sparkle size={22} weight="duotone" />,
    title: 'Your control',
    tone: 'green',
    body: [
      'You can edit or delete your writing whenever you want.',
      'If you want to close your account or delete everything at once, just reach out to us below.',
      'If we ever change how we handle privacy, we\'ll tell you right away in the app.',
    ],
  },
];

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer size="narrow" className="py-12 sm:py-16">
      <div className="space-y-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 text-gray-nav hover:text-green">
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>

        <SectionHeader
          title="Privacy"
          description="How we handle your data, how AI interacts with your writing, and how you stay in control."
          icon={
            <div className="icon-block icon-block-lg">
              <Shield size={32} weight="duotone" />
            </div>
          }
        />

        <Surface variant="bezel">
          <div className="p-8 sm:p-10">
            <p className="text-[17px] font-medium text-gray-text leading-relaxed">
              We don't think of your reflections as data points or inventory. They are your private thoughts, and our job is to keep them safe. This principle guides everything we build—from how we store your notes to how we integrate AI.
            </p>
          </div>
        </Surface>

        <div className="space-y-6">
          {sections.map((section) => (
            <Surface key={section.title} variant="flat" className="overflow-hidden">
              <div className="p-7 sm:p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="icon-block icon-block-sm">{section.icon}</div>
                  <h2 className="text-[20px] font-display text-gray-text">{section.title}</h2>
                </div>
                <div className="space-y-4 text-[15px] font-medium leading-relaxed text-gray-light">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </Surface>
          ))}
        </div>

        <Surface variant="bezel">
          <div className="p-8 sm:p-10">
            <div className="mb-4 flex items-center gap-4">
              <div className="icon-block icon-block-sm">
                <Envelope size={20} weight="duotone" />
              </div>
              <h2 className="text-[20px] font-display text-gray-text">Questions</h2>
            </div>

            <p className="text-[15px] font-medium leading-relaxed text-gray-light">
              If you have questions about your data or want to delete your account, email us directly:
            </p>
            <a
              href="mailto:robinsaha@gmail.com"
              className="mt-4 inline-flex items-center gap-2 text-green font-bold hover:underline tracking-tight"
            >
              <Envelope size={16} weight="bold" />
              robinsaha@gmail.com
            </a>
          </div>
        </Surface>
      </div>
    </PageContainer>
  );
};
