import { Section, Row, Column, Text } from '@react-email/components';

export const EmailHeader = () => (
  <Section className="mb-8">
    <Row>
      <Column>
        {/* Minimalist text logo for email, could be replaced with an Img tag */}
        <Text className="text-2xl font-serif italic text-brand-text m-0">Reflections</Text>
      </Column>
    </Row>
  </Section>
);
