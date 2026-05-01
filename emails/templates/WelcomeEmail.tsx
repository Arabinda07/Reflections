import { Text, Button, Section } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { UnsubscribeFooter } from '../components/UnsubscribeFooter';

interface WelcomeEmailProps {
  userName?: string;
  loginUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export const WelcomeEmail = ({ 
  userName = 'there', 
  loginUrl = 'https://reflections.app/login',
  unsubscribeUrl = 'https://reflections.app/account',
  preferencesUrl = 'https://reflections.app/account'
}: WelcomeEmailProps) => {
  return (
    <BaseEmailLayout previewText="Welcome to Reflections. A quiet place for your thoughts.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Welcome, {userName}.
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Reflections is a private writing space designed to stay quiet until you need it. 
        There are no social feeds, no streaks, and no pressure to perform. 
        Just a blank page and optional AI support when you ask for it.
      </Text>

      <Section className="my-8 text-center">
        <Button 
          href={loginUrl}
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Write your first note
        </Button>
      </Section>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        We're glad you're here. Take a few quiet minutes before the day ends.
      </Text>

      <UnsubscribeFooter unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
    </BaseEmailLayout>
  );
};

export default WelcomeEmail;
