import { Text, Button, Section } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabaseChangeEmail = () => {
  return (
    <BaseEmailLayout previewText="Confirm your new email address for Reflections.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Confirm new email address
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        We received a request to change your account email. Please verify this new email address by clicking the button below.
      </Text>

      <Section className="my-8 text-center">
        <Button 
          href="{{ .ConfirmationURL }}"
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Confirm Email
        </Button>
      </Section>
      
      <Text className="text-sm text-brand-light leading-relaxed">
        If you didn't request this change, please ignore this email and your account will remain secure.
      </Text>
    </BaseEmailLayout>
  );
};

export default SupabaseChangeEmail;
