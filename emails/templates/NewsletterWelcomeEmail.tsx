import { Text, Button, Section } from '@react-email/components';
import { BaseEmailLayout } from '../components/BaseEmailLayout.tsx';
import { EmailHeader } from '../components/EmailHeader.tsx';
import { UnsubscribeFooter } from '../components/UnsubscribeFooter.tsx';

interface NewsletterWelcomeEmailProps {
  userName?: string;
  loginUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export const NewsletterWelcomeEmail = ({ 
  userName = 'there', 
  loginUrl = 'https://reflections.app/login',
  unsubscribeUrl = 'https://reflections.app/account',
  preferencesUrl = 'https://reflections.app/account'
}: NewsletterWelcomeEmailProps) => {
  return (
    <BaseEmailLayout previewText="Welcome to Reflections. You're subscribed to the weekly note.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Welcome, {userName}.
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Reflections is a private writing space designed to stay out of the way until you need it. 
        Write at your own pace, keep your notes to yourself, and ask for AI support whenever it feels right.
      </Text>

      <Text className="text-base text-brand-light leading-relaxed mb-6">
        You're also on the list for our weekly note. Every week, I share a short reflection on the pace of our daily lives, simple prompts to help you pause, and a few lines worth reading. 
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
        We're glad you're here. Take a few minutes before the day ends.
      </Text>

      <UnsubscribeFooter unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
    </BaseEmailLayout>
  );
};

export default NewsletterWelcomeEmail;
