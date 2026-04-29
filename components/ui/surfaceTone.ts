export type SurfaceTone = 'inherit' | 'neutral' | 'paper' | 'sage' | 'sky' | 'honey' | 'clay';

export const SURFACE_TONE_CLASS: Record<SurfaceTone, string> = {
  inherit: 'surface-tone-auto',
  neutral: 'surface-tone-neutral',
  paper: 'surface-tone-paper',
  sage: 'surface-tone-sage',
  sky: 'surface-tone-sky',
  honey: 'surface-tone-honey',
  clay: 'surface-tone-clay',
};

export const SURFACE_SCOPE_CLASS: Record<Exclude<SurfaceTone, 'inherit'>, string> = {
  neutral: 'surface-scope-neutral',
  paper: 'surface-scope-paper',
  sage: 'surface-scope-sage',
  sky: 'surface-scope-sky',
  honey: 'surface-scope-honey',
  clay: 'surface-scope-clay',
};

export type MetadataTone = 'default' | 'green' | 'orange' | 'red' | 'blue' | SurfaceTone;

export const METADATA_TONE_CLASS: Record<MetadataTone, string> = {
  default: 'metadata-pill--default',
  inherit: 'metadata-pill--auto',
  neutral: 'metadata-pill--neutral',
  paper: 'metadata-pill--paper',
  sage: 'metadata-pill--sage',
  sky: 'metadata-pill--sky',
  honey: 'metadata-pill--honey',
  clay: 'metadata-pill--clay',
  green: 'metadata-pill--green',
  orange: 'metadata-pill--orange',
  red: 'metadata-pill--red',
  blue: 'metadata-pill--blue',
};

