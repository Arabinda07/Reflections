import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CalendarBlank, EnvelopeOpen, LockKey, PaperPlaneTilt } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { CompletionCardActions } from '../../components/ui/CompletionCardActions';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { buildCompletionCardPayload, type CompletionCardPayload } from '../../services/completionCardPayload';
import {
  futureLetterService,
  getFutureLetterOpenState,
} from '../../services/engagementServices';
import { FutureLetter, RoutePath } from '../../types';

type DateOptionId = '7d' | '30d' | '6m' | '1y' | 'custom';

const DATE_OPTIONS: Array<{ id: DateOptionId; label: string; apply: (date: Date) => Date }> = [
  { id: '7d', label: '7 days', apply: (date) => addDays(date, 7) },
  { id: '30d', label: '30 days', apply: (date) => addDays(date, 30) },
  { id: '6m', label: '6 months', apply: (date) => addMonths(date, 6) },
  { id: '1y', label: '1 year', apply: (date) => addMonths(date, 12) },
  { id: 'custom', label: 'Custom', apply: (date) => date },
];

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDate = (date: string | Date) =>
  dateFormatter.format(date instanceof Date ? date : new Date(date));

const getOpenDate = (optionId: DateOptionId, customDate: string) => {
  if (optionId === 'custom') {
    return new Date(`${customDate}T00:00:00`);
  }

  const option = DATE_OPTIONS.find((item) => item.id === optionId) || DATE_OPTIONS[0];
  return option.apply(new Date());
};

export const FutureLetters: React.FC = () => {
  const navigate = useNavigate();
  const [letters, setLetters] = useState<FutureLetter[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedOption, setSelectedOption] = useState<DateOptionId>('30d');
  const [customDate, setCustomDate] = useState(toDateInputValue(addDays(new Date(), 30)));
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedLetter, setOpenedLetter] = useState<FutureLetter | null>(null);
  const [openingLetterId, setOpeningLetterId] = useState<string | null>(null);
  const [shakeLetterId, setShakeLetterId] = useState<string | null>(null);
  const [cardPayload, setCardPayload] = useState<CompletionCardPayload | null>(null);

  const minCustomDate = useMemo(() => toDateInputValue(addDays(new Date(), 1)), []);
  const openDate = useMemo(
    () => getOpenDate(selectedOption, customDate),
    [customDate, selectedOption],
  );
  const isOpenDateValid = Number.isFinite(openDate.getTime());

  useEffect(() => {
    let isMounted = true;

    const loadLetters = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const nextLetters = await futureLetterService.list();
        if (isMounted) {
          setLetters(nextLetters);
        }
      } catch (loadError) {
        console.error('Could not load future letters:', loadError);
        if (isMounted) {
          setError('I could not load your letters just now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLetters();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || isScheduling) return;
    if (!isOpenDateValid) {
      setError('Choose an open date before scheduling this letter.');
      return;
    }

    setIsScheduling(true);
    setError(null);
    try {
      const letter = await futureLetterService.create({
        title: title.trim() || `Letter for ${formatDate(openDate)}`,
        content: content.trim(),
        openAt: openDate.toISOString(),
      });
      setLetters((current) => [...current, letter].sort((a, b) => a.openAt.localeCompare(b.openAt)));
      setTitle('');
      setContent('');
      setCardPayload(
        buildCompletionCardPayload({
          kind: 'letter_scheduled',
          date: new Date(),
        }),
      );
    } catch (scheduleError) {
      console.error('Could not schedule future letter:', scheduleError);
      setError('I could not schedule this letter just now.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleOpenLetter = async (letter: FutureLetter) => {
    const openState = getFutureLetterOpenState(letter);
    if (openingLetterId) return;

    if (openState.state === 'locked') {
      setShakeLetterId(letter.id);
      setTimeout(() => setShakeLetterId(null), 400);
      return;
    }

    setOpeningLetterId(letter.id);
    setError(null);
    try {
      const opened = await futureLetterService.open(letter.id);
      setOpenedLetter(opened);
      setLetters((current) =>
        current.map((item) => (item.id === opened.id ? opened : item)),
      );
    } catch (openError) {
      console.error('Could not open future letter:', openError);
      setError('I could not open this letter just now.');
    } finally {
      setOpeningLetterId(null);
    }
  };

  return (
    <>
      <PageContainer size="wide" className="surface-scope-honey pb-24 pt-6 md:pt-10">
        <div className="space-y-8">
          <button
            onClick={() => navigate(RoutePath.HOME)}
            className="group flex items-center gap-2 text-sm font-bold text-gray-nav hover:text-green transition-all duration-300 w-fit hover:-translate-x-1"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
            <span>Back</span>
          </button>

          <SectionHeader
            title="Write a letter to yourself"
            icon={
              <div className="icon-block icon-block-lg">
                <PaperPlaneTilt size={34} weight="duotone" />
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Surface variant="flat" tone="paper" className="rounded-[2.5rem] overflow-hidden">
              <form onSubmit={handleSchedule} className="space-y-6 p-6 sm:p-8">
                <div className="space-y-2">
                  <label htmlFor="future-letter-title" className="label-caps text-gray-nav">
                    Title
                  </label>
                  <input
                    id="future-letter-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="A title for later"
                    className="input-surface h-12 w-full px-4 text-[15px] font-semibold text-gray-text"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="future-letter-content" className="label-caps text-gray-nav">
                    Letter
                  </label>
                  <textarea
                    id="future-letter-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write what you want a future day to hold."
                    className="input-surface min-h-[320px] w-full resize-none rounded-[22px] p-5 font-serif text-[19px] leading-8 text-gray-text placeholder:text-gray-nav/35"
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="label-caps mb-3 text-gray-nav">Open date</legend>
                  <div className="grid gap-2 sm:grid-cols-5">
                    {DATE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedOption(option.id)}
                        aria-pressed={selectedOption === option.id}
                        className={`min-h-11 rounded-[var(--radius-control)] border px-3 text-[13px] font-black transition-colors ${
                          selectedOption === option.id
                            ? 'border-green/30 bg-green/10 text-green'
                            : 'control-surface text-gray-nav hover:border-green/20 hover:text-green'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {selectedOption === 'custom' ? (
                    <input
                      type="date"
                      value={customDate}
                      min={minCustomDate}
                      onChange={(event) => setCustomDate(event.target.value)}
                      aria-label="Custom open date"
                      className="input-surface h-12 w-full px-4 text-[15px] font-semibold text-gray-text"
                    />
                  ) : null}
                </fieldset>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] font-medium text-gray-light">
                    {isOpenDateValid
                      ? `This letter opens on ${formatDate(openDate)}.`
                      : 'Choose an open date before scheduling.'}
                  </p>
                  <Button type="submit" disabled={!content.trim() || !isOpenDateValid} isLoading={isScheduling} className="w-full sm:w-auto">
                    Schedule letter
                  </Button>
                </div>

                {cardPayload ? <CompletionCardActions payload={cardPayload} /> : null}
              </form>
            </Surface>

            <Surface variant="bezel" tone="honey" className="rounded-[2.5rem] overflow-hidden">
              <div className="space-y-5 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[26px] font-display font-bold text-gray-text">
                      Waiting to open
                    </h2>
                  </div>
                  <CalendarBlank size={26} weight="duotone" className="text-honey" />
                </div>

                {error ? (
                  <p
                    className="surface-inline-panel surface-tone-clay p-4 text-[13px] font-bold text-clay"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                ) : null}

                {isLoading ? (
                  <p className="text-[14px] font-medium text-gray-light">Loading letters...</p>
                ) : letters.length === 0 ? (
                  <p className="text-[14px] font-medium leading-relaxed text-gray-light">
                    No letters yet. Write one when there is something you want to return to later.
                  </p>
                ) : (
                    <div className="space-y-4">
                      {letters.map((letter) => {
                        const openState = getFutureLetterOpenState(letter);
                        const isOpening = openingLetterId === letter.id;
                        const isLocked = openState.state === 'locked';

                        return (
                          <div
                            key={letter.id}
                            className="group relative surface-inline-panel overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:border-honey/40 hover:shadow-lg"
                          >
                            <div className="relative z-10">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="break-words font-display text-[20px] font-bold text-gray-text group-hover:text-green transition-colors duration-300">
                                    {letter.title}
                                  </h3>
                                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-nav/60">
                                    Opens {formatDate(letter.openAt)}
                                  </p>
                                </div>
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 ${isLocked ? 'bg-body/50 text-gray-nav' : 'bg-green/10 text-green group-hover:rotate-12'}`}>
                                  {isLocked ? (
                                    <motion.div
                                      animate={shakeLetterId === letter.id ? { x: [-4, 4, -4, 4, 0] } : {}}
                                      transition={{ duration: 0.4, ease: "easeInOut" }}
                                    >
                                      <LockKey size={20} weight="duotone" />
                                    </motion.div>
                                  ) : (
                                    <EnvelopeOpen size={20} weight="duotone" />
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant={isLocked ? 'outline' : 'secondary'}
                                size="sm"
                                disabled={Boolean(openingLetterId)}
                                isLoading={isOpening}
                                onClick={() => handleOpenLetter(letter)}
                                className={`min-h-11 w-full rounded-2xl font-bold transition-all ${isLocked ? 'opacity-60' : 'group-hover:bg-green group-hover:text-white group-hover:border-transparent'}`}
                                aria-label={
                                  isOpening
                                    ? `Opening ${letter.title}`
                                    : isLocked
                                      ? `Locked until ${formatDate(letter.openAt)}`
                                      : openState.actionLabel
                                }
                              >
                                {openState.actionLabel}
                              </Button>
                            </div>
                            {/* Subtle background glow on hover */}
                            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-honey/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                          </div>
                        );
                      })}
                    </div>
                )}
              </div>
            </Surface>
          </div>
        </div>
      </PageContainer>

      <ModalSheet
        isOpen={Boolean(openedLetter)}
        onClose={() => setOpenedLetter(null)}
        title={openedLetter?.title || 'Letter'}
        icon={<EnvelopeOpen size={20} weight="duotone" />}
        size="lg"
      >
        {openedLetter ? (
          <div className="space-y-5">
            <p className="text-[12px] font-black uppercase tracking-widest text-gray-nav/60">
              Opened {openedLetter.openedAt ? formatDate(openedLetter.openedAt) : 'today'}
            </p>
            <div className="surface-inline-panel whitespace-pre-wrap rounded-[22px] p-5 font-serif text-[19px] leading-8 text-gray-text">
              {openedLetter.content}
            </div>
          </div>
        ) : null}
      </ModalSheet>
    </>
  );
};
