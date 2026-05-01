import { Section, Text, Link } from '@react-email/components';
import React from 'react';

interface UnsubscribeFooterProps {
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export const UnsubscribeFooter = ({ unsubscribeUrl, preferencesUrl }: UnsubscribeFooterProps) => (
  <Section className="mt-12 pt-6 border-t border-black/5">
    <Text className="text-xs text-brand-light leading-relaxed m-0 text-center">
      Reflections by Arabinda
      <br />
      <br />
      <Link href={preferencesUrl} className="text-brand-accent underline">Manage Preferences</Link>
      {' • '}
      <Link href={unsubscribeUrl} className="text-brand-accent underline">Unsubscribe</Link>
    </Text>
  </Section>
);
