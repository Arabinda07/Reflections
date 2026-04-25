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
    title: 'The basics',
    body: [
      'By using Reflections, you agree to these terms. If they don\'t work for you, please don\'t create an account.',
      'You must be at least 13 years old. If you\'re under 18, please make sure a parent or guardian has looked these over.',
      'You are responsible for your login details. We can\'t recover accounts if a password was shared or leaked.',
    ],
  },
  {
    icon: <Shield size={22} weight="duotone" />,
    title: 'Your writing',
    body: [
      'Everything you write in Reflections belongs to you. We don\'t claim ownership of your notes or attachments.',
      'You allow us to store and sync your notes so we can show them back to you. We won\'t share, sell, or use them for anything else.',
      'AI insights are for your personal use. They aren\'t professional medical or legal advice.',
    ],
  },
  {
    icon: <Warning size={22} weight="duotone" />,
    title: 'Rules',
    body: [
      'Don\'t use Reflections for anything illegal or harmful.',
      'Please don\'t try to break the service or access other people\'s data.',
      'We might suspend accounts that violate these rules, but we\'ll try to talk to you first.',
    ],
  },
  {
    icon: <Sparkle size={22} weight="duotone" />,
    title: 'The service',
    body: [
      'We work hard to keep your writing safe and the app running, but we provide Reflections "as-is" without guarantees.',
      'We may change or remove features as the app evolves. We\'ll let you know about big changes ahead of time.',
      'The free version has limits on notes and AI use. These might shift as we see how people use the app.',
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
          title="Terms"
          description="The basics of using Reflections—what you agree to, what we promise, and how to reach us."
        />

        <Surface variant="bezel">
          <div className="p-8 sm:p-10">
            <p className="text-[17px] font-medium text-gray-text leading-relaxed">
              Reflections is a tool for your personal thoughts. These terms are here to set clear expectations between you and the team building it. We want to be upfront about how things work and what we're both responsible for.
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
              If anything here is confusing or you have concerns, reach out:
            </p>
            <a
              href="mailto:robinsaha434@gmail.com"
              className="mt-4 inline-flex items-center gap-2 text-green font-bold hover:underline tracking-tight"
            >
              <Envelope size={16} weight="bold" />
              robinsaha434@gmail.com
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
