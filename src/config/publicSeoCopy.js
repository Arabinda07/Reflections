export const PUBLIC_SEO_LAST_MODIFIED = '2026-05-21';

export const PUBLIC_SEO_COPY = {
  home: {
    key: 'home',
    path: '/',
    title: 'Reflections - Private Journal for Writing and Mood Notes',
    description:
      'Write privately, name moods, and notice patterns at your own pace. Reflections keeps AI optional and writing first.',
    h1: 'Private journal for writing and mood notes',
    intro:
      'Write a few lines, name the mood if it helps, and return to patterns at your own pace.',
    heroAriaLabel: 'Your mind beautifully organized',
    heroLines: ['Your mind', 'beautifully', 'organized'],
    heroIntro:
      "A private journal. Write what's on your mind, notice the patterns, and keep it to yourself",
    ctaLabel: 'Begin writing',
    sections: [
      {
        title: 'Private writing',
        body: 'Your notes stay tied to your account and centered on your own words.',
      },
      {
        title: 'Mood notes and tags',
        body: 'Name moods, add tags, and notice ordinary patterns without scores or streaks.',
      },
      {
        title: 'Optional AI support',
        body:
          'Reflect with AI and Refresh with AI run when you choose. Smart Mode can refresh the Life Wiki only if you turn it on.',
      },
    ],
    softwareDescription:
      'Reflections is a private journal for writing notes, naming moods, and noticing patterns. AI support runs only when you choose it or turn on Smart Mode.',
    serviceDescription:
      'Reflections helps people write private notes, name moods, organize tags, and ask for AI-supported reflection when they choose.',
  },
  faq: {
    key: 'faq',
    path: '/faq',
    title: 'Reflections FAQ - Journaling, AI, Privacy, and Pricing',
    description:
      'Answers about Reflections, private journaling, optional AI, Life Wiki, privacy, and Pro pricing.',
    h1: 'Reflections FAQ',
    intro:
      'Clear answers about what Reflections does, what it stores, when AI runs, and how pricing works.',
    sections: [
      {
        title: 'What is Reflections?',
        body:
          'Reflections is a private journal for writing notes, naming moods, adding tags, and noticing patterns over time.',
      },
      {
        title: 'Does AI run automatically?',
        body:
          'No. AI support runs when you ask for a reflection or Life Wiki refresh, or when you explicitly turn on Smart Mode.',
      },
      {
        title: 'Is Reflections therapy?',
        body:
          'No. Reflections is a personal writing tool. It is not therapy, diagnosis, crisis support, or professional mental health care.',
      },
      {
        title: 'What does Pro include?',
        body:
          'Pro adds more writing room, on-demand AI reflections, and more Life Wiki refreshes after a 3-day trial.',
      },
    ],
    faqSchema: [
      {
        question: 'What is Reflections?',
        answer:
          'Reflections is a private journal built around writing. You save notes, name moods, add tags, and can ask AI for a reflection when you want help noticing patterns.',
      },
      {
        question: 'Does AI run automatically?',
        answer:
          'AI support runs when you press Reflect with AI or Refresh with AI, or when you turn on Smart Mode for Life Wiki refreshes after saves.',
      },
      {
        question: 'Is Reflections free?',
        answer:
          'Yes. The free tier includes 30 notes per month, one AI reflection sample, and one Life Wiki refresh after enough writing. Pro adds weekly or monthly paid plans after a trial.',
      },
      {
        question: 'Is Reflections therapy?',
        answer:
          'No. Reflections is a personal writing tool for noticing thoughts more clearly. It is not therapy, diagnosis, crisis support, or professional mental health care.',
      },
      {
        question: 'What is the Life Wiki?',
        answer:
          'The Life Wiki is an AI-supported personal reference that grows from saved writing when you choose to refresh it.',
      },
      {
        question: 'How is my data protected?',
        answer:
          'Reflections uses account-scoped database rules and private storage. The Privacy page explains what is stored, what leaves the app, and how deletion works.',
      },
    ],
  },
  privacy: {
    key: 'privacy',
    path: '/privacy',
    title: 'Reflections Privacy - Notes, AI, Payments, and Deletion',
    description:
      'What Reflections stores, when AI receives writing, how payments work, and how to export or delete your notes.',
    h1: 'Reflections privacy',
    intro:
      'This page explains what Reflections stores, when AI is used, and how you can export or delete your writing.',
    sections: [
      {
        title: 'What Reflections keeps',
        body:
          'Account details, notes, moods, tags, attachments, future letters, and Life Wiki pages are tied to your account.',
      },
      {
        title: 'AI and Smart Mode',
        body:
          'AI features use relevant writing only when you choose an AI action or turn on Smart Mode.',
      },
      {
        title: 'Export and deletion',
        body:
          'You can export notes, delete individual notes, and remove saved app data from Account.',
      },
    ],
  },
  about: {
    key: 'about',
    path: '/about',
    title: 'About Reflections - A Private Journal by Arabinda',
    description:
      'A note from Arabinda about building Reflections as a private journal with mood notes, Life Wiki, and optional AI.',
    h1: 'About Reflections',
    intro:
      'Reflections began as a slower place to write, notice feelings, and leave without being pushed to perform.',
    sections: [
      {
        title: 'Private writing',
        body: 'Reflections is built around writing that stays private and ordinary.',
      },
      {
        title: 'No pressure loops',
        body: 'Write at your own pace without streaks, scores, or public feeds.',
      },
      {
        title: 'AI should wait',
        body:
          'AI support appears when invited, or when Smart Mode is explicitly enabled, and should never act like it knows you better than you do.',
      },
    ],
    articleSchema: {
      headline: 'About Reflections - A Private Journal by Arabinda',
      authorName: 'Arabinda',
      datePublished: '2025-01-01',
      dateModified: PUBLIC_SEO_LAST_MODIFIED,
      description:
        'A note from Arabinda about building Reflections as a private journal with mood notes, Life Wiki, and optional AI.',
    },
  },
};

export const PUBLIC_SEO_PAGE_KEYS = ['home', 'faq', 'privacy', 'about'];
export const PUBLIC_SEO_PAGES = PUBLIC_SEO_PAGE_KEYS.map((key) => PUBLIC_SEO_COPY[key]);
export const PUBLIC_SEO_DEFAULT = PUBLIC_SEO_COPY.home;

export const PUBLIC_APP_ROUTE_DESCRIPTION =
  'Open Reflections to continue writing, signing in, or managing your private journal.';
export const PUBLIC_APP_ROUTE_SOCIAL_DESCRIPTION =
  'Open Reflections to continue writing.';
