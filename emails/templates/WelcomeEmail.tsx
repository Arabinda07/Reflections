import { Text, Button, Section } from '@react-email/components';
import { BaseEmailLayout } from '../components/BaseEmailLayout.tsx';
import { EmailHeader } from '../components/EmailHeader.tsx';
import { SupportFooter } from '../components/SupportFooter.tsx';

interface WelcomeEmailProps {
  userName?: string;
  loginUrl: string;
  supportEmail: string;
}

export const WelcomeEmail = ({ 
  userName = 'there', 
  loginUrl = 'https://reflections.app/login',
  supportEmail = 'robinsaha434@gmail.com'
}: WelcomeEmailProps) => {
  return (
    <BaseEmailLayout previewText="Welcome to Reflections. A place for your thoughts.">
      <EmailHeader />
      
      <Text className="text-2xl font-serif text-brand-text mb-6">
        Welcome, {userName}.
      </Text>
      
      <Text className="text-base text-brand-light leading-relaxed mb-6">
        Reflections is a private writing space designed to stay out of the way until you need it. 
        Write at your own pace, keep your notes to yourself, and ask for AI support whenever it feels right.
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

      <SupportFooter supportEmail={supportEmail} />
    </BaseEmailLayout>
  );
};

export default WelcomeEmail;
