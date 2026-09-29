import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import shadcnPlugin from '@shadcn/lint';
import reactHooks from 'eslint-plugin-react-hooks';

const sharedContracts = [
  {
    pattern: '^(Button|AmbientMusicButton)$',
    allow: ['layout'],
    deny: ['spacing', 'color', 'shape', 'typography'],
    message: {
      spacing: 'Avoid custom padding on Button. Use size="sm" or size="lg" variants.',
      color: 'Avoid custom background/text colors on Button. Use variant="primary"|"secondary"|"ghost".',
      shape: 'Button maintains fixed rounded corners according to design tokens.',
      typography: 'Button uses fixed font scale (btn-lg, btn-sm).',
    },
  },
  {
    pattern: '^(Chip|MetadataPill)$',
    allow: ['layout', 'metadata-pill.*', 'chip-.*'],
    deny: ['spacing', 'typography'],
    message: {
      spacing: 'Pills and Chips maintain standard ergonomic touch padding.',
      typography: 'Pills use the standard design system label/metadata scale.',
    },
  },
  {
    pattern: '^Surface$',
    allow: ['layout', 'spacing', 'shape', 'motion', 'group', 'relative', 'overflow-.*'],
    deny: ['color'],
    message: {
      color: 'Surface background must use the tone prop (sage, dawn, paper) or semantic scope class.',
    },
  },
  {
    pattern: '^ModalSheet$',
    allow: ['layout', 'spacing', 'modal-sheet.*'],
    deny: ['color'],
    message: {
      color: 'ModalSheet panel and backdrop styling must use modal-sheet.css and design tokens.',
    },
  },
  {
    pattern: '^RouteLoadingFrame$',
    allow: ['layout', 'spacing', 'color', 'surface-scope-.*', 'page-wash', 'bg-body'],
  },
  {
    pattern: '^OverlayFeedback$',
    allow: ['layout', 'spacing', 'color', 'overlay-feedback.*'],
  },
  {
    pattern: '^Alert$',
    deny: ['color'],
    message: {
      color: 'Alert uses the variant prop (warning, danger, info) rather than custom background overrides.',
    },
  },
  {
    pattern: '^PageContainer$',
    allow: ['layout', 'spacing', 'color', 'surface-scope-.*', 'page-wash', 'bg-.*', 'relative', 'z-.*'],
  },
  {
    pattern: '^SectionHeader$',
    allow: ['layout', 'insights-section-header'],
    deny: ['spacing'],
    message: {
      spacing: 'Containers maintain standard responsive page gutters and rhythm.',
    },
  },
  {
    pattern: '^Editor$',
    allow: ['layout', 'spacing', 'typography', 'color'],
  },
  {
    pattern: '^WhisperComposerControl$',
    allow: ['layout', 'spacing', 'shape', 'typography', 'color', 'motion'],
  },
  {
    pattern: '^StorageImage$',
    allow: ['layout', 'motion', 'shape', 'spacing'],
  },
  {
    pattern: '^Skeleton$',
    allow: ['layout', 'spacing', 'shape'],
  },
];

const allowedArbitraryValues = [
  'transition-[background-color,border-color,color,box-shadow,transform,filter]',
  'transition-[color,transform]',
  'transition-[opacity,transform]',
  'transition-[border-color]',
  'transition-[transform,border-color,box-shadow]',
  'transition-[color,transform,background-color]',
  'transition-[opacity,transform,border-color]',
  'transition-[color,border-color,transform]',
  'transition-[transform,border-color,background-color,color]',
  'transition-[background-color,color]',
  'transition-[background-color,border-color,color,opacity]',
  'ease-[cubic-bezier(0.32,0.72,0,1)]',
  'active:scale-[0.98]',
  'scale-[1.01]',
  'hover:scale-[1.02]',
  'rounded-[var(--radius-control)]',
  'rounded-[var(--radius-panel)]',
  'rounded-[2rem]',
  'rounded-[2.5rem]',
  'rounded-[20px]',
  'rounded-[22px]',
  'rounded-[28px]',
  'min-h-[100dvh]',
  'min-h-[34dvh]',
  'sm:min-h-[42dvh]',
  'max-w-[1440px]',
  'object-[48%_center]',
  'sm:object-[64%_center]',
  'pb-[calc(env(safe-area-inset-bottom)+1.75rem)]',
  'pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)]',
  'sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)]',
  'pt-[env(safe-area-inset-top)]',
  'pb-[env(safe-area-inset-bottom)]',
  'bottom-[calc(2rem+env(safe-area-inset-bottom))]',
  'lg:pt-[28vh]',
  'h-[min(66vmin,34rem)]',
  'w-[min(66vmin,34rem)]',
  '[animation-delay:var(--note-card-delay)]',
  'top-[var(--native-top-control-offset)]',
  'pt-[var(--native-page-top-padding)]',
  'max-w-[var(--measure-wide)]',
  'max-h-[72vh]',
  'duration-[600ms]',
  'border-[var(--surface-current-border)]',
  'aspect-[21/9]',
  'z-[100]',
  'z-[110]',
  'w-[1px]',
  'h-[24px]',
  'max-w-[150px]',
  'max-w-[600px]',
  '[background-color:oklch(from_var(--bg-color)_l_c_h_/_0.95)]',
  'shadow-[0_8px_20px_-12px_var(--green-shadow)]',
  'hover:shadow-[0_10px_24px_-12px_var(--green-shadow)]',
  'sm:shadow-[0_10px_24px_-12px_var(--green-shadow)]',
  'sm:hover:shadow-[0_12px_28px_-12px_var(--green-shadow)]',
  'h-[1.125rem]',
  'w-[1.125rem]',
  'transition-[transform,box-shadow,background-color]',
  'transition-[background-color,border-color,box-shadow,color]',
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'android/**',
      'node_modules/**',
      'public/**',
      'coverage/**',
      'scratch/**',
      'emails/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'scripts/**',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      shadcn: shadcnPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // General TypeScript and JS recommended relaxations for existing project
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'off', // TypeScript handles undef checks

      // Design system rules:
      // Hard error: zero tolerance for raw colors repository-wide
      'shadcn/no-raw-colors': 'error',
      // Transitional warning: arbitrary values and restyling tracked for phased elimination
      'shadcn/no-arbitrary-values': [
        'warn',
        {
          allow: allowedArbitraryValues,
        },
      ],
      'shadcn/no-restyle': [
        'warn',
        {
          allow: ['layout', 'spacing', 'surface-scope-sage', 'surface-scope-paper', 'page-wash'],
          contracts: sharedContracts,
        },
      ],
    },
  },
  {
    // Strict error enforcement for the refactored core surfaces
    files: [
      'components/ui/Input.tsx',
      'pages/dashboard/Landing.tsx',
      'pages/dashboard/SingleNote.tsx',
      'pages/dashboard/Insights.tsx',
      'pages/dashboard/MyNotes.tsx',
      'pages/dashboard/CreateNote.tsx',
    ],
    rules: {
      'shadcn/no-arbitrary-values': [
        'error',
        {
          allow: allowedArbitraryValues,
        },
      ],
      'shadcn/no-restyle': [
        'error',
        {
          allow: ['layout', 'spacing', 'surface-scope-sage', 'surface-scope-paper', 'page-wash'],
          contracts: sharedContracts,
        },
      ],
    },
  }
);

