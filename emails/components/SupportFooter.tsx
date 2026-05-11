import { Section, Text, Link } from '@react-email/components';

interface SupportFooterProps {
  supportEmail: string;
}

export const SupportFooter = ({ supportEmail }: SupportFooterProps) => (
  <Section className="mt-12 pt-6 border-t border-black/5">
    <Text className="text-xs text-brand-light leading-relaxed m-0 text-center">
      Reflections by Arabinda
      <br />
      Need help? Reply to this email or write to{' '}
      <Link href={`mailto:${supportEmail}`} className="text-brand-accent underline">
        {supportEmail}
      </Link>
    </Text>
  </Section>
);
