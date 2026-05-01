import { Text } from '@react-email/components';
import React from 'react';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabasePasswordChanged = () => {
  return (
    <BaseEmailLayout previewText="Your password was successfully updated.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Password Updated
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Your account password has been successfully changed.
      </Text>

      <Text className="text-sm text-brand-light leading-relaxed">
        If you did not make this change, please reset your password immediately or contact support to secure your account.
      </Text>
    </BaseEmailLayout>
  );
};

export default SupabasePasswordChanged;
