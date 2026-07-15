import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { CalendarBlank } from '@phosphor-icons/react/CalendarBlank';
import { EnvelopeOpen } from '@phosphor-icons/react/EnvelopeOpen';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { LockKey } from '@phosphor-icons/react/LockKey';
import { Hourglass } from '@phosphor-icons/react/Hourglass';
import ReactCalendar from 'react-calendar';
import './react-calendar.css';
import './Calendar.css';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { CompletionCardActions } from '../../components/ui/CompletionCardActions';
import { EmptyState } from '../../components/ui/EmptyState';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Surface } from '../../components/ui/Surface';
import { buildCompletionCardPayload, type CompletionCardPayload } from '../../services/completionCardPayload';
import {
  futureLetterService,
  getFutureLetterOpenState,
} from '../../services/futureLetterService';
import { FutureLetter, RoutePath } from '../../types';
import { formatLongDateUTC } from '../../src/utils/dateFormatter';

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
  const datePickerRef = useRef<HTMLDetailsElement | null>(null);

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
        title: title.trim() || `Letter for ${formatLongDateUTC(openDate)}`,
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
      <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <button
            onClick={() => navigate(RoutePath.DASHBOARD)}
            className="group flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-[color,transform,background-color] duration-300 hover:-translate-x-1 hover:bg-[var(--surface-current-soft-bg)] hover:text-[var(--surface-current-accent)]"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
            <span>Back</span>
          </button>

          <SectionHeader
            title="Write a letter to your future self"
            description="Write down your thoughts, memories, or a message today. We will keep it safe and locked. It will open only on the day you choose."
          />

          <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Surface variant="flat" tone="paper" className="rounded-[2rem]">
              <form onSubmit={handleSchedule} className="space-y-6 p-6 sm:p-8">
                <div className="space-y-2">
                  <label htmlFor="future-letter-title" className="label-caps text-gray-nav">
                    Letter name
                  </label>
                  <input
                    id="future-letter-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give this letter a name (e.g., Message for my 30th birthday)"
                    className="input-surface dashboard-field-text h-12 w-full px-4"
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
                    placeholder="Write about your day, a hope, or a message to yourself."
                    className="input-surface dashboard-letter-text min-h-[320px] w-full resize-none rounded-[22px] p-5 placeholder:text-gray-nav/35"
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="label-caps mb-3 text-gray-nav">Open date</legend>
                  <div className="flex flex-wrap gap-2">
                    {DATE_OPTIONS.map((option) => (
                      <Chip
                        key={option.id}
                        active={selectedOption === option.id}
                        aria-pressed={selectedOption === option.id}
                        onClick={() => setSelectedOption(option.id)}
                      >
                        {option.label}
                      </Chip>
                    ))}
                  </div>
                  {selectedOption === 'custom' ? (
                    <div className="relative w-full">
                      <details ref={datePickerRef} className="relative w-full">
                        <summary 
                          aria-label="Custom open date"
                          className="input-surface flex h-12 w-full cursor-pointer list-none items-center justify-between px-4 text-ui-base font-semibold text-gray-text [&::-webkit-details-marker]:hidden"
                        >
                          <span>{customDate ? format(new Date(`${customDate}T12:00:00`), 'MMMM do, yyyy') : 'Select custom date...'}</span>
                          <CalendarBlank size={18} weight="regular" className="text-gray-nav" />
                        </summary>
                        <div className="absolute left-0 z-20 mt-1.5 w-full max-w-[320px] rounded-2xl border border-border bg-surface p-4 shadow-card sm:max-w-[340px]">
                          <ReactCalendar
                            onChange={(value) => {
                              const dateVal = Array.isArray(value) ? value[0] : value;
                              if (dateVal instanceof Date) {
                                setCustomDate(toDateInputValue(dateVal));
                              }
                              if (datePickerRef.current) datePickerRef.current.open = false;
                            }}
                            value={customDate ? new Date(`${customDate}T12:00:00`) : new Date()}
                            minDate={new Date(`${minCustomDate}T12:00:00`)}
                            className="w-full border-none font-sans"
                          />
                        </div>
                      </details>
                    </div>
                  ) : null}
                </fieldset>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="dashboard-supporting-text">
                    {isOpenDateValid
                      ? `This letter will stay locked until ${formatLongDateUTC(openDate)}.`
                      : 'Choose a date when this letter should open.'}
                  </p>
                  <Button type="submit" disabled={!content.trim() || !isOpenDateValid} isLoading={isScheduling} className="w-full sm:w-auto">
                    Lock and save letter
                  </Button>
                </div>

                {cardPayload ? <CompletionCardActions payload={cardPayload} /> : null}
              </form>
            </Surface>

            <Surface variant="bezel" tone="sage" className="rounded-[2rem] overflow-hidden">
              <div className="space-y-5 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="dashboard-card-title-lg">
                      Letters waiting to open
                    </h2>
                  </div>
                  <Hourglass size={26} weight="duotone" className="text-[var(--surface-current-accent)]" />
                </div>

                {error ? (
                  <p
                    className="surface-inline-panel surface-tone-clay dashboard-supporting-text p-4 font-bold text-clay"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                ) : null}

                {isLoading ? (
                  <div className="space-y-3" aria-label="Loading letters">
                    <Skeleton variant="text" className="h-5 w-3/4" />
                    <Skeleton variant="card" className="h-28" />
                    <Skeleton variant="card" className="h-28" />
                  </div>
                ) : letters.length === 0 ? (
                  <EmptyState
                    surface="none"
                    icon={<EnvelopeSimple size={32} weight="duotone" className="text-[var(--surface-current-accent)]/60" />}
                    title="No letters locked yet"
                    description="Write a letter today to remember a special feeling, a lesson, or a dream. It will open only when the time is right."
                  />
                ) : (
                    <div className="space-y-4">
                      {letters.map((letter) => {
                        const openState = getFutureLetterOpenState(letter);
                        const isOpening = openingLetterId === letter.id;
                        const isLocked = openState.state === 'locked';

                        return (
                          <div
                            key={letter.id}
                            className={`group relative surface-inline-panel dashboard-tone-card overflow-hidden rounded-3xl p-5 transition-[border-color,box-shadow,transform] duration-300 hover:shadow-lg ${shakeLetterId === letter.id ? 'animate-shake-x' : ''}`}
                          >
                            <div className="relative z-10">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="dashboard-card-title break-words dashboard-hover-title">
                                    {letter.title}
                                  </h3>
                                  <p className="dashboard-caption mt-1 opacity-70">
                                    Opens {formatLongDateUTC(letter.openAt)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant={isLocked ? 'outline' : 'secondary'}
                                size="sm"
                                disabled={Boolean(openingLetterId)}
                                isLoading={isOpening}
                                onClick={() => handleOpenLetter(letter)}
                                className={`min-h-11 w-full sm:w-auto px-6 font-bold transition-[background-color,border-color,color,opacity] ${isLocked ? 'opacity-60' : 'group-hover:bg-[var(--surface-current-accent)] group-hover:text-white group-hover:border-transparent'}`}
                                aria-label={
                                  isOpening
                                    ? `Opening ${letter.title}`
                                    : isLocked
                                      ? `Locked until ${formatLongDateUTC(letter.openAt)}`
                                      : openState.actionLabel
                                }
                              >
                                {openState.actionLabel}
                              </Button>
                            </div>
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
        icon={<EnvelopeOpen size={22} weight="duotone" />}
        size="lg"
      >
        {openedLetter ? (
          <div className="space-y-5">
            <p className="dashboard-caption opacity-70">
              Opened {openedLetter.openedAt ? formatLongDateUTC(openedLetter.openedAt) : 'today'}
            </p>
            <div className="surface-inline-panel dashboard-letter-text whitespace-pre-wrap rounded-[22px] p-5">
              {openedLetter.content}
            </div>
          </div>
        ) : null}
      </ModalSheet>
    </>
  );
};
