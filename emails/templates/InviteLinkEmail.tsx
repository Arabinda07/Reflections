import { Text, Button, Section } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

interface InviteLinkEmailProps {
  inviteLink: string;
}

export const InviteLinkEmail = ({ 
  inviteLink = 'https://reflections.app/auth/verify?token=example'
}: InviteLinkEmailProps) => {
  return (
    <BaseEmailLayout previewText="Your magic link to enter Reflections.">
      <EmailHeader />
      
      <Text className="text-xl font-serif text-brand-text mb-6">
        Sign in to Reflections
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Click the button below to securely sign in. This link expires in 24 hours.
      </Text>

      <Section className="my-8 text-center">
        <Button 
          href={inviteLink}
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Sign in automatically
        </Button>
      </Section>
      
      <Text className="text-sm text-brand-light leading-relaxed">
        If you didn't request this email, you can safely ignore it.
      </Text>
    </BaseEmailLayout>
  );
};

export default InviteLinkEmail;
