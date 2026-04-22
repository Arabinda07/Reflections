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
    title: 'What we store',
    tone: 'green',
    body: [
      'Your account identity includes your email address and the profile details you choose to add.',
      'Your writing data includes notes, moods, tags, tasks, and attachments. Those stay tied to your authenticated account.',
      'Storage runs on Supabase with row-level security so entries are scoped to you rather than exposed as shared application data.',
    ],
  },
  {
    icon: <Lock size={22} weight="duotone" />,
    title: 'How AI touches your writing',
    tone: 'green',
    body: [
      'AI features are used only when you ask for them, such as a reflection or a Life Wiki refresh.',
      'We do not use your notes to train models. The product is designed to support your writing, not harvest it.',
      'Generated insights are meant to stay private and personal, not become a marketing or advertising asset.',
    ],
  },
  {
    icon: <Shield size={22} weight="duotone" />,
    title: 'Security posture',
    tone: 'green',
    body: [
      'Data is encrypted in transit and at rest through the Supabase and cloud infrastructure underneath the product.',
      'Row-level security is the core boundary: your reflections are scoped to your own authenticated session.',
      'We continue tightening privacy and deletion tooling as the product matures, and we try to be explicit about what is live versus what is still manual.',
    ],
  },
  {
    icon: <Sparkle size={22} weight="duotone" />,
    title: 'Your rights',
    tone: 'green',
    body: [
      'You can create, update, and delete your writing inside the app.',
      'You can also remove saved writing and profile data from the account screen. Full sign-in account closure is still handled through the contact channel below.',
      'If we make material privacy changes, we will update this page and communicate them in-product.',
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
          eyebrow="Privacy"
          title="A calmer privacy policy"
          description="Reflections is built around the idea that your writing belongs to you. This page explains the current product reality without dressing it up as something more finished than it is."
          icon={
            <div className="icon-block icon-block-lg">
              <Shield size={32} weight="duotone" />
            </div>
          }
        />

        <Surface variant="bezel">
          <div className="p-8 sm:p-10">
            <p className="text-[17px] font-medium text-gray-text leading-relaxed">
              We do not think of your reflections as inventory. They are private writing, and the product is meant to help you return to them safely. That principle shapes how we store data, when AI is allowed to touch it, and how we talk about deletion and export when those flows are still evolving.
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
              <h2 className="text-[20px] font-display text-gray-text">Contact</h2>
            </div>

            <p className="text-[15px] font-medium leading-relaxed text-gray-light">
              If you need help with data deletion, export, or privacy questions, email us directly:
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
