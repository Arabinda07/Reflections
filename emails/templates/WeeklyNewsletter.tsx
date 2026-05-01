import { Text } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { FounderNoteBlock } from '../components/FounderNoteBlock';
import { PrivacyNote } from '../components/PrivacyNote';
import { UnsubscribeFooter } from '../components/UnsubscribeFooter';

interface WeeklyNewsletterProps {
  issueNumber?: number;
  content: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export const WeeklyNewsletter = ({ 
  issueNumber = 1,
  content = "This week I've been thinking about the pace of our daily lives. How often do we let silence sit without reaching for a distraction? \n\nI encourage you to take five minutes today to just be.",
  unsubscribeUrl = 'https://reflections.app/account',
  preferencesUrl = 'https://reflections.app/account'
}: WeeklyNewsletterProps) => {
  return (
    <BaseEmailLayout previewText={`A Few Lines — Issue #${issueNumber}`}>
      <EmailHeader />
      
      <Text className="text-sm font-medium tracking-widest uppercase text-brand-accent mb-6">
        Issue #{issueNumber}
      </Text>
      
      <FounderNoteBlock content={content} />
      
      <PrivacyNote />

      <UnsubscribeFooter unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
    </BaseEmailLayout>
  );
};

export default WeeklyNewsletter;
