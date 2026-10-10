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
    allow: ['layout', 'spacing', 'modal-sheet.*', 'modal-sheet-panel--compact', 'modal-sheet-panel--mood-detail', 'modal-sheet-body--compact', 'modal-sheet-body--mood-detail', 'auth-mobile-more-backdrop', 'auth-mobile-more-sheet-body', 'auth-mobile-more-sheet-panel', 'onboarding-modal-panel', 'onboarding-modal-body'],
    deny: ['color'],
    message: {
      color: 'ModalSheet panel and backdrop styling must use modal-sheet.css and design tokens.',
    },
  },
  {
    pattern: '^RouteLoadingFrame$',
    allow: ['layout', 'spacing', 'color', 'surface-scope-paper', 'surface-scope-sage', 'surface-scope-sky', 'surface-scope-honey', 'surface-scope-clay', 'surface-scope-neutral', 'page-wash', 'bg-body'],
  },
  {
    pattern: '^OverlayFeedback$',
    allow: ['layout', 'spacing', 'color', 'overlay-feedback', 'overlay-feedback--veil', 'overlay-feedback--screen', 'overlay-feedback--soft', 'overlay-feedback-card', 'overlay-feedback-card--row'],
  },
  {
    pattern: '^PublicPageIcon$',
    allow: ['layout', 'motion', 'color', 'transition-transform', 'group-hover:scale-110', 'group-hover:-rotate-6', 'ease-out-expo', 'duration-500'],
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
    allow: ['layout', 'spacing', 'color', 'gap-section', 'surface-scope-sage', 'surface-scope-paper', 'surface-scope-sky', 'surface-scope-honey', 'surface-scope-clay', 'surface-scope-neutral', 'page-wash', 'bg-.*', 'relative', 'z-.*'],
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
    allow: ['layout', 'spacing', 'shape', 'typography', 'color', 'motion', 'control-surface'],
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
  // Hardware Safe Area Geometries & Native Offsets
  'pb-[calc(env(safe-area-inset-bottom)+1.75rem)]',
  'pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)]',
  'sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)]',
  'pt-[env(safe-area-inset-top)]',
  'pb-[env(safe-area-inset-bottom)]',
  'bottom-[calc(2rem+env(safe-area-inset-bottom))]',
  'bottom-[4.75rem]',
  'top-[var(--native-top-control-offset)]',
  'pt-[var(--native-page-top-padding)]',

  // Dynamic Viewport / Aspect Clamps & Camera Framing
  'h-[min(66vmin,34rem)]',
  'w-[min(66vmin,34rem)]',
  'min-h-[34dvh]',
  'sm:min-h-[42dvh]',
  'min-h-[80vh]',
  'h-[100dvh]',
  'min-h-[100dvh]',
  'min-h-[160px]',
  'rounded-[1.5rem]',
  'lg:pt-[28vh]',
  'aspect-[21/9]',
  'aspect-[4/5]',
  'max-h-[52vh]',
  'max-h-[72vh]',
  'max-w-[var(--measure-wide)]',
  'object-[48%_center]',
  'sm:object-[64%_center]',
  '[animation-delay:var(--note-card-delay)]',

  // Landing Hero Micro-Interactions & GPU Transitions (tested by impeccableAuditFollowupContract.test.ts)
  'transition-[color,transform]',
  'transition-[color,border-color,transform]',
  'transition-[transform,box-shadow,background-color]',
  'transition-[background-color,border-color,box-shadow,color]',
  'transition-[background-color,border-color,color,box-shadow,transform,filter]',
  'transition-[opacity,transform,border-color]',
  'transition-[opacity,transform]',
  'transition-[color,transform,background-color]',

  // Dynamic OKLCH Relative Color Math & Shadows
  '[background-color:oklch(from_var(--bg-color)_l_c_h_/_0.95)]',
  'shadow-[0_8px_20px_-12px_var(--green-shadow)]',
  'hover:shadow-[0_10px_24px_-12px_var(--green-shadow)]',
  'sm:shadow-[0_10px_24px_-12px_var(--green-shadow)]',
  'sm:hover:shadow-[0_12px_28px_-12px_var(--green-shadow)]',

  // Scoped Surface Tokens (dynamic CSS custom props set by surface scope classes)
  'hover:bg-[var(--surface-current-soft-bg)]',
  'hover:text-[var(--surface-current-accent)]',
  'text-[var(--surface-current-accent)]',
  'text-[var(--surface-current-accent)]/60',
  'group-hover:bg-[var(--surface-current-accent)]',
  'border-[var(--surface-current-accent)]',
  'border-[var(--surface-current-accent)]/20',
  'hover:border-[var(--surface-current-accent)]/30',
  'bg-[var(--surface-current-soft-bg)]',

  // Complex Grid Layouts (page-specific responsive patterns)
  'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
  'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]',
  'lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]',
  'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]',
  'md:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]',

  // Comparison & Table Column Sizing
  'first:w-[30%]',

  // Navigation Chrome Z-Indices (layering system)
  'z-[1]',
  'z-[90]',
  'z-[95]',
  'z-[100]',
  'z-[105]',
  'z-[110]',
  'z-[200]',

  // Brand Typography & Editorial Measures
  'text-[22px]',
  'sm:text-[26px]',
  'max-w-[150px]',
  'text-[17px]',
  'tracking-[0.16em]',
  'tracking-[0.22em]',
  'rounded-[var(--radius-chip)]',
  'border-[1.5px]',
  'rounded-[20px]',
  'leading-[0.92]',
  'leading-[0.95]',
  'max-w-[10ch]',
  'max-w-[12ch]',
  'max-w-[14ch]',
  'max-w-[20ch]',
  'max-w-[24ch]',
  'max-w-[26ch]',
  'max-w-[30ch]',
  'max-w-[32ch]',
  'max-w-[35ch]',
  'max-w-[38ch]',
  'max-w-[42ch]',
  'max-w-[45ch]',
  'max-w-[46ch]',
  'max-w-[48ch]',
  'max-w-[52ch]',
  'max-w-[54ch]',
  'max-w-[55ch]',
  'max-w-[60ch]',
  'max-w-[62ch]',
  'max-w-[65ch]',
  'max-w-[70ch]',
  'max-w-[72ch]',

  // Native Layout Offsets (mobile sidebar safe area math)
  'mt-[calc(var(--native-top-control-offset)-var(--native-page-top-padding))]',

  // Authenticated Mobile Bottom Nav (floating pill bar)
  'pb-[calc(0.45rem+env(safe-area-inset-bottom))]',
  'min-h-[3.625rem]',
  'max-w-[23rem]',
  'rounded-[1.45rem]',
  'shadow-[0_-10px_28px_-24px_oklch(from_var(--green-shadow)_l_c_h_/_0.28)]',
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
      // Phase 2 — Core dashboard surfaces
      'components/ui/Input.tsx',
      'pages/dashboard/Landing.tsx',
      'pages/dashboard/SingleNote.tsx',
      'pages/dashboard/Insights.tsx',
      'pages/dashboard/MyNotes.tsx',
      'pages/dashboard/CreateNote.tsx',
      'pages/dashboard/Relationships.tsx',
      'pages/dashboard/RelationshipProfile.tsx',
      'pages/dashboard/ReleaseMode.tsx',
      'pages/dashboard/Account.tsx',
      // Phase 3 — Authenticated views
      'pages/dashboard/HomeAuthenticated.tsx',
      'pages/dashboard/FutureLetters.tsx',
      'pages/dashboard/LifeWiki.tsx',
      'pages/dashboard/MoodPicker.tsx',
      'pages/dashboard/moodConfig.ts',
      // Phase 3 — Layouts & Navigation
      'layouts/DashboardLayout.tsx',
      'layouts/NavigationBar.tsx',
      'layouts/MobileSidebar.tsx',
      'layouts/AuthenticatedMobileNav.tsx',
      'layouts/BugReportFlow.tsx',
      'layouts/PublicAppShell.tsx',
      // Phase 3 — Auth & Onboarding
      'pages/auth/SignIn.tsx',
      'pages/auth/SignUp.tsx',
      'pages/auth/ResetPassword.tsx',
      'pages/onboarding/ModeSelect.tsx',
      // Phase 3D — Primitives & Overlays
      'components/ui/Button.tsx',
      'components/ui/ModalSheet.tsx',
      'components/ui/ProUpgradeCTA.tsx',
      'components/ui/AmbientMusicButton.tsx',
      'components/ui/ConfirmationDialog.tsx',
      'components/ui/NoteSearchPalette.tsx',
      'components/ui/PaperPlaneToast.tsx',
      'components/ui/PublicFooter.tsx',
      'components/ui/PublicHeader.tsx',
      'components/ui/PublicPageIcon.tsx',
      'components/ui/PublicPageShell.tsx',
      'components/ui/ReferralInvitePanel.tsx',
      'components/ui/StartupScreen.tsx',
      'components/ui/SyncBanner.tsx',
      'components/ui/Tooltip.tsx',
      // Phase 4 — Public Pages, Routes & Errors
      'pages/dashboard/FAQ.tsx',
      'pages/dashboard/PrivacyPolicy.tsx',
      'pages/dashboard/AboutArabinda.tsx',
      'pages/dashboard/ComparisonPage.tsx',
      'pages/NotFound.tsx',
      'pages/RouteErrorBoundary.tsx',
      'features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx',
      'features/private-writing-onboarding/PrivateWritingSetupStep.tsx',
      'features/private-writing-recovery/RecoverPrivateWriting.tsx',
      'index.tsx',
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

