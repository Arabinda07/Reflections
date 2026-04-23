import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, Shield, Warning, Sparkle, Envelope, ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';

const sections = [
  {
    icon: <Handshake size={22} weight="duotone" />,
    title: 'What you agree to',
    body: [
      'By using Reflections you agree to these terms. If you do not agree, please do not create an account.',
      'You must be at least 13 years old to use this service. If you are under 18, you confirm that a parent or guardian has reviewed these terms.',
      'You are responsible for keeping your login credentials secure. We cannot recover accounts compromised by shared or leaked passwords.',
    ],
  },
  {
    icon: <Shield size={22} weight="duotone" />,
    title: 'Your content',
    body: [
      'Everything you write in Reflections belongs to you. We do not claim ownership of your notes, moods, tags, or any other content you create.',
      'You grant us a limited license to store, sync, and display your content back to you as part of the service. We will not share, sell, or use your content for any other purpose.',
      'AI-generated reflections and insights are created for your personal use. They are not professional advice — medical, legal, or otherwise.',
    ],
  },
  {
    icon: <Warning size={22} weight="duotone" />,
    title: 'Acceptable use',
    body: [
      'Do not use Reflections to store or transmit content that is illegal, harmful, or violates the rights of others.',
      'Do not attempt to interfere with the service, reverse-engineer the application, or access other users\u2019 data.',
      'We reserve the right to suspend accounts that violate these guidelines, though we will try to communicate before taking action.',
    ],
  },
  {
    icon: <Sparkle size={22} weight="duotone" />,
    title: 'Service and availability',
    body: [
      'Reflections is provided as-is. We work to keep the service running and your data safe, but we cannot guarantee uninterrupted availability.',
      'We may update, modify, or discontinue features as the product evolves. We will communicate significant changes in advance when possible.',
      'The free tier has usage limits, such as a monthly note cap and limited AI reflections. These limits may change as we learn how the product is used.',
    ],
  },
];

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer size="narrow" className="py-12 sm:py-16">
      <div className="space-y-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 text-gray-nav hover:text-green">
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>

        <SectionHeader
          title="Terms of Service"
          description="The basics of using Reflections — what you agree to, what we promise, and how to reach us."
          icon={
            <div className="icon-block icon-block-lg">
              <Handshake size={32} weight="duotone" />
            </div>
          }
        />

        <Surface variant="bezel">
          <div className="p-8 sm:p-10">
            <p className="text-[17px] font-medium text-gray-text leading-relaxed">
              Reflections is a personal journaling tool. These terms exist to set fair expectations between you and the people building it — not to create legal leverage. We want to be straightforward about how the product works and what each side is responsible for.
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
              If anything here is unclear or you have concerns, reach out directly:
            </p>
            <a
              href="mailto:robinsaha@gmail.com"
              className="mt-4 inline-flex items-center gap-2 text-green font-bold hover:underline tracking-tight"
            >
              <Envelope size={16} weight="bold" />
              robinsaha@gmail.com
            </a>

            <p className="mt-6 text-[13px] font-semibold text-gray-nav/60">
              Last updated: April 2026
            </p>
          </div>
        </Surface>
      </div>
    </PageContainer>
  );
};
