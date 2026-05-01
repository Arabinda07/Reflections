import { Text } from '@react-email/components';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabaseEmailChanged = () => {
  return (
    <BaseEmailLayout previewText="Your email address was successfully updated.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Email Updated
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Your account's email address has been successfully changed.
      </Text>

      <Text className="text-sm text-brand-light leading-relaxed">
        If you did not make this change, please contact support immediately to secure your account.
      </Text>
    </BaseEmailLayout>
  );
};

export default SupabaseEmailChanged;
