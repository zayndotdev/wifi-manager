export type ThemePalette =
  | 'clean-slate'
  | 'warm-neutral'
  | 'nordic-sky'
  | 'emerald-minimal'
  | 'onyx-contrast';

export interface ThemeConfig {
  id: ThemePalette;
  name: string;
  description: string;
  dotColor: string;
  isDark?: boolean;
}
