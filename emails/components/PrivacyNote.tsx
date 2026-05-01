import { Section, Text } from '@react-email/components';
import React from 'react';

export const PrivacyNote = () => (
  <Section className="my-6">
    <Text className="text-xs text-brand-light text-center m-0 italic">
      Your notes remain entirely private. We only send these updates 
      to share platform news or provide your requested weekly check-ins.
    </Text>
  </Section>
);
