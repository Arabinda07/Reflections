import { Text, Button, Section } from '@react-email/components';
import { BaseEmailLayout } from '../components/BaseEmailLayout';
import { EmailHeader } from '../components/EmailHeader';

export const SupabaseMagicLink = () => {
  return (
    <BaseEmailLayout previewText="Your magic link to enter Reflections.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Your Magic Link
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Click the button below to securely sign in to your account. This link is only valid for a few minutes.
      </Text>

      <Section className="my-8 text-center">
        <Button 
          href="{{ .ConfirmationURL }}"
          className="bg-brand-accent text-white font-medium px-6 py-3 rounded-xl"
        >
          Sign In Automatically
        </Button>
      </Section>
      
      <Text className="text-sm text-brand-light leading-relaxed">
        If you didn't request a magic link, you can safely ignore this email.
      </Text>
    </BaseEmailLayout>
  );
};

export default SupabaseMagicLink;
