import { Text, Button, Section } from '@react-email/components';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabaseConfirmSignup = () => {
  return (
    <BaseEmailLayout previewText="Verify your email to enter Reflections.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Confirm your email address
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Please verify your email address to complete your registration and enter Reflections. 
        This link will expire in 24 hours.
      </Text>

      <Section className="my-8 text-center">
        {/* Supabase uses Go template syntax for the URL */}
        <Button 
          href="{{ .ConfirmationURL }}"
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Verify Email
        </Button>
      </Section>
      
      <Text className="text-sm text-brand-light leading-relaxed">
        If you didn't create an account with Reflections, you can safely ignore this email.
      </Text>
    </BaseEmailLayout>
  );
};

export default SupabaseConfirmSignup;
