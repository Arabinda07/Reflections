import { Html, Head, Body, Container, Tailwind, Preview } from '@react-email/components';
import React from 'react';

interface BaseEmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export const BaseEmailLayout = ({ children, previewText }: BaseEmailLayoutProps) => {
  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: {
                  bg: '#f7f8f6',
                  text: '#3c3f3a',
                  accent: '#8da691',
                  light: '#868c81',
                },
              },
            },
          },
        }}
      >
        <Head />
        {previewText && <Preview>{previewText}</Preview>}
        <Body className="bg-brand-bg text-brand-text font-sans py-10 antialiased">
          <Container className="mx-auto max-w-[600px] bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-black/5">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
