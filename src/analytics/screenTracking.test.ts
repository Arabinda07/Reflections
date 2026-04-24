import { describe, expect, it, vi } from 'vitest';
import { createScreenViewTracker, getScreenGroup } from './screenTracking';

describe('getScreenGroup', () => {
  it('maps the main app routes into stable screen groups', () => {
    expect(getScreenGroup('/')).toBe('home');
    expect(getScreenGroup('/login')).toBe('auth');
    expect(getScreenGroup('/signup')).toBe('auth');
    expect(getScreenGroup('/notes')).toBe('notes');
    expect(getScreenGroup('/notes/new')).toBe('note_editor');
    expect(getScreenGroup('/notes/123')).toBe('note_detail');
    expect(getScreenGroup('/account')).toBe('account');
    expect(getScreenGroup('/insights')).toBe('insights');
    expect(getScreenGroup('/faq')).toBe('support');
    expect(getScreenGroup('/privacy')).toBe('legal');
  });
});

describe('createScreenViewTracker', () => {
  it('captures the first route and de-duplicates the same location under StrictMode', () => {
    const capture = vi.fn();
    const trackScreenView = createScreenViewTracker({
      capture,
      isNative: true,
    });

    expect(trackScreenView({ pathname: '/notes', search: '', hash: '' })).toBe(true);
    expect(trackScreenView({ pathname: '/notes', search: '', hash: '' })).toBe(false);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('screen_view', {
      route: '/notes',
      screen_group: 'notes',
      is_native: true,
    });
  });

  it('treats query-string changes as distinct screen views', () => {
    const capture = vi.fn();
    const trackScreenView = createScreenViewTracker({
      capture,
      isNative: false,
    });

    trackScreenView({ pathname: '/notes', search: '?view=week', hash: '' });
    trackScreenView({ pathname: '/notes', search: '?view=month', hash: '' });

    expect(capture).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenNthCalledWith(2, 'screen_view', {
      route: '/notes?view=month',
      screen_group: 'notes',
      is_native: false,
    });
  });
});
