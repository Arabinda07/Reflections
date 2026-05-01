import { Section, Text, Img, Row, Column } from '@react-email/components';

interface FounderNoteBlockProps {
  content: string;
}

export const FounderNoteBlock = ({ content }: FounderNoteBlockProps) => (
  <Section className="mt-8 bg-[#fdfaf5] p-6 sm:p-8 rounded-[1.5rem] border border-black/5">
    <Section className="mb-4">
      <Row>
        <Column className="w-12">
          {/* We use a public absolute URL for images in email */}
          <Img
            src="https://reflections-app.vercel.app/assets/images/founder.png"
            width="40"
            height="40"
            alt="Arabinda"
            className="rounded-full grayscale-[0.3]"
          />
        </Column>
        <Column>
          <Text className="font-serif italic text-xl text-brand-text m-0 ml-3">A Few Lines</Text>
        </Column>
      </Row>
    </Section>
    <Text className="text-base leading-relaxed text-brand-light m-0 whitespace-pre-line">
      {content}
    </Text>
    <Text className="mt-6 mb-0 text-brand-text font-medium text-sm">— Arabinda</Text>
  </Section>
);
