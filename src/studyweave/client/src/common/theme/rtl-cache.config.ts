import createCache from '@emotion/cache';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { prefixer } from 'stylis';
import type { EmotionCache } from '@emotion/cache';
import type { TextDirection } from '../../shared/localization/localization';

const ltrCache = createCache({
  key: 'mui-ltr',
  stylisPlugins: [prefixer],
});

const rtlCache = createCache({
  key: 'mui-rtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

/**
 * Select the Emotion cache configured for the active writing direction.
 *
 * @param direction - Current localization direction.
 * @returns A stable LTR or RTL Emotion cache.
 * @example
 * const cache = getDirectionalCache('rtl');
 */
export const getDirectionalCache = (direction: TextDirection): EmotionCache =>
  direction === 'rtl' ? rtlCache : ltrCache;
