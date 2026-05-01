import { Text, Button, Section } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabaseInviteUser = () => {
  return (
    <BaseEmailLayout previewText="You've been invited to Reflections.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        You've been invited
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        You have been invited to join Reflections. Click the button below to set up your account and find a quiet place for your thoughts.
      </Text>

      <Section className="my-8 text-center">
        <Button 
          href="{{ .ConfirmationURL }}"
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Accept Invite
        </Button>
      </Section>
    </BaseEmailLayout>
  );
};

export default SupabaseInviteUser;
