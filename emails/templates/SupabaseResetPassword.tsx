import { Text, Button, Section } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabaseResetPassword = () => {
  return (
    <BaseEmailLayout previewText="Reset your Reflections password.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Reset your password
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        We received a request to reset your password. Click the button below to choose a new password.
      </Text>

      <Section className="my-8 text-center">
        <Button 
          href="{{ .ConfirmationURL }}"
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Reset Password
        </Button>
      </Section>
      
      <Text className="text-sm text-brand-light leading-relaxed">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </Text>
    </BaseEmailLayout>
  );
};

export default SupabaseResetPassword;
