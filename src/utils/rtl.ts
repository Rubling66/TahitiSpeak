import { logger } from '../services/LoggingService';

/**
 * RTL (Right-to-Left) language codes
 * These languages are written from right to left
 */
export const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian/Farsi
  'ur', // Urdu
  'yi', // Yiddish
  'ku', // Kurdish
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'arc', // Aramaic
  'ckb', // Central Kurdish
  'dv', // Dhivehi
  'ha', // Hausa (when written in Arabic script)
  'iw', // Hebrew (alternative code)
  'ji', // Yiddish (alternative code)
  'khw', // Khowar
  'ks', // Kashmiri
  'mzn', // Mazanderani
  'pnb', // Western Punjabi
  'prs', // Dari
  'ug-arab', // Uyghur in Arabic script
]);

/**
 * Bidirectional (BiDi) language codes
 * These languages can contain both LTR and RTL text
 */
export const BIDI_LANGUAGES = new Set([
  'ar', 'he', 'fa', 'ur', 'yi', 'ku', 'ps', 'sd', 'ug'
]);

/**
 * Check if a locale uses RTL text direction
 */
export function isRTLLocale(locale: string): boolean {
  if (!locale) return false;
  
  // Extract language code from locale (e.g., 'ar-SA' -> 'ar')
  const languageCode = locale.toLowerCase().split('-')[0];
  
  return RTL_LANGUAGES.has(languageCode);
}

/**
 * Check if a locale supports bidirectional text
 */
export function isBidiLocale(locale: string): boolean {
  if (!locale) return false;
  
  const languageCode = locale.toLowerCase().split('-')[0];
  
  return BIDI_LANGUAGES.has(languageCode);
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

/**
 * Get CSS direction property value for a locale
 */
export function getCSSDirection(locale: string): 'ltr' | 'rtl' {
  return getTextDirection(locale);
}

/**
 * Get appropriate CSS class names for RTL support
 */
export function getRTLClassNames(locale: string, baseClasses: string = ''): string {
  const direction = getTextDirection(locale);
  const rtlClass = direction === 'rtl' ? 'rtl' : 'ltr';
  
  return `${baseClasses} ${rtlClass} dir-${direction}`.trim();
}

/**
 * Apply RTL-aware margin/padding utilities
 */
export function getRTLSpacingClass(locale: string, property: 'margin' | 'padding', side: 'left' | 'right', size: string): string {
  const isRTL = isRTLLocale(locale);
  const actualSide = isRTL ? (side === 'left' ? 'right' : 'left') : side;
  const prefix = property === 'margin' ? 'm' : 'p';
  const sidePrefix = actualSide === 'left' ? 'l' : 'r';
  
  return `${prefix}${sidePrefix}-${size}`;
}

/**
 * Get RTL-aware float class
 */
export function getRTLFloatClass(locale: string, float: 'left' | 'right'): string {
  const isRTL = isRTLLocale(locale);
  const actualFloat = isRTL ? (float === 'left' ? 'right' : 'left') : float;
  
  return `float-${actualFloat}`;
}

/**
 * Get RTL-aware text alignment class
 */
export function getRTLTextAlignClass(locale: string, align: 'left' | 'right' | 'center' | 'justify'): string {
  if (align === 'center' || align === 'justify') {
    return `text-${align}`;
  }
  
  const isRTL = isRTLLocale(locale);
  const actualAlign = isRTL ? (align === 'left' ? 'right' : 'left') : align;
  
  return `text-${actualAlign}`;
}

/**
 * Apply RTL transformations to CSS-in-JS styles
 */
export function applyRTLStyles(locale: string, styles: Record<string, any>): Record<string, any> {
  if (!isRTLLocale(locale)) {
    return styles;
  }

  const rtlStyles = { ...styles };
  
  // Transform directional properties
  const transformations: Record<string, string> = {
    'marginLeft': 'marginRight',
    'marginRight': 'marginLeft',
    'paddingLeft': 'paddingRight',
    'paddingRight': 'paddingLeft',
    'left': 'right',
    'right': 'left',
    'borderLeft': 'borderRight',
    'borderRight': 'borderLeft',
    'borderLeftWidth': 'borderRightWidth',
    'borderRightWidth': 'borderLeftWidth',
    'borderLeftColor': 'borderRightColor',
    'borderRightColor': 'borderLeftColor',
    'borderLeftStyle': 'borderRightStyle',
    'borderRightStyle': 'borderLeftStyle',
    'textAlign': 'textAlign' // Special handling below
  };

  Object.entries(transformations).forEach(([original, transformed]) => {
    if (original in rtlStyles) {
      if (original === 'textAlign') {
        // Handle text alignment
        const value = rtlStyles[original];
        if (value === 'left') {
          rtlStyles[original] = 'right';
        } else if (value === 'right') {
          rtlStyles[original] = 'left';
        }
      } else {
        // Swap directional properties
        const originalValue = rtlStyles[original];
        const transformedValue = rtlStyles[transformed];
        
        rtlStyles[transformed] = originalValue;
        if (transformedValue !== undefined) {
          rtlStyles[original] = transformedValue;
        } else {
          delete rtlStyles[original];
        }
      }
    }
  });

  // Set direction
  rtlStyles.direction = 'rtl';
  
  return rtlStyles;
}

/**
 * Format text with proper BiDi markers
 */
export function formatBidiText(text: string, locale: string): string {
  if (!isBidiLocale(locale) || !text) {
    return text;
  }

  const isRTL = isRTLLocale(locale);
  
  // Add Unicode BiDi control characters
  const LTR_MARK = '\u200E'; // Left-to-Right Mark
  const RTL_MARK = '\u200F'; // Right-to-Left Mark
  const LTR_EMBED = '\u202A'; // Left-to-Right Embedding
  const RTL_EMBED = '\u202B'; // Right-to-Left Embedding
  const POP_DIRECTIONAL = '\u202C'; // Pop Directional Formatting
  
  // Wrap text with appropriate directional embedding
  if (isRTL) {
    return `${RTL_EMBED}${text}${POP_DIRECTIONAL}`;
  } else {
    return `${LTR_EMBED}${text}${POP_DIRECTIONAL}`;
  }
}

/**
 * Clean BiDi control characters from text
 */
export function cleanBidiText(text: string): string {
  if (!text) return text;
  
  // Remove Unicode BiDi control characters
  return text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
}

/**
 * Get appropriate font family for locale
 */
export function getLocaleFontFamily(locale: string): string {
  const languageCode = locale.toLowerCase().split('-')[0];
  
  const fontFamilies: Record<string, string> = {
    'ar': 'Noto Sans Arabic, Arial, sans-serif',
    'he': 'Noto Sans Hebrew, Arial, sans-serif',
    'fa': 'Noto Sans Persian, Arial, sans-serif',
    'ur': 'Noto Sans Urdu, Arial, sans-serif',
    'th': 'Noto Sans Thai, Arial, sans-serif',
    'zh': 'Noto Sans CJK SC, Arial, sans-serif',
    'ja': 'Noto Sans CJK JP, Arial, sans-serif',
    'ko': 'Noto Sans CJK KR, Arial, sans-serif',
    'hi': 'Noto Sans Devanagari, Arial, sans-serif',
    'bn': 'Noto Sans Bengali, Arial, sans-serif',
    'ta': 'Noto Sans Tamil, Arial, sans-serif',
    'te': 'Noto Sans Telugu, Arial, sans-serif',
    'ml': 'Noto Sans Malayalam, Arial, sans-serif',
    'kn': 'Noto Sans Kannada, Arial, sans-serif',
    'gu': 'Noto Sans Gujarati, Arial, sans-serif',
    'pa': 'Noto Sans Gurmukhi, Arial, sans-serif',
    'or': 'Noto Sans Oriya, Arial, sans-serif',
    'as': 'Noto Sans Assamese, Arial, sans-serif',
    'my': 'Noto Sans Myanmar, Arial, sans-serif',
    'km': 'Noto Sans Khmer, Arial, sans-serif',
    'lo': 'Noto Sans Lao, Arial, sans-serif',
    'si': 'Noto Sans Sinhala, Arial, sans-serif',
    'am': 'Noto Sans Ethiopic, Arial, sans-serif',
    'ka': 'Noto Sans Georgian, Arial, sans-serif',
    'hy': 'Noto Sans Armenian, Arial, sans-serif'
  };
  
  return fontFamilies[languageCode] || 'Inter, system-ui, sans-serif';
}

/**
 * RTL-aware icon rotation
 */
export function getRTLIconRotation(locale: string, icon: 'arrow-left' | 'arrow-right' | 'chevron-left' | 'chevron-right'): string {
  if (!isRTLLocale(locale)) {
    return '';
  }
  
  const rotations: Record<string, string> = {
    'arrow-left': 'rotate-180',
    'arrow-right': 'rotate-180',
    'chevron-left': 'rotate-180',
    'chevron-right': 'rotate-180'
  };
  
  return rotations[icon] || '';
}

/**
 * Create RTL-aware CSS custom properties
 */
export function createRTLCSSProperties(locale: string): Record<string, string> {
  const isRTL = isRTLLocale(locale);
  
  return {
    '--text-direction': getTextDirection(locale),
    '--start-direction': isRTL ? 'right' : 'left',
    '--end-direction': isRTL ? 'left' : 'right',
    '--font-family': getLocaleFontFamily(locale)
  };
}

/**
 * RTL utility class for React components
 */
export class RTLUtils {
  private locale: string;
  
  constructor(locale: string) {
    this.locale = locale;
  }
  
  get isRTL(): boolean {
    return isRTLLocale(this.locale);
  }
  
  get direction(): 'ltr' | 'rtl' {
    return getTextDirection(this.locale);
  }
  
  get isBidi(): boolean {
    return isBidiLocale(this.locale);
  }
  
  getSpacingClass(property: 'margin' | 'padding', side: 'left' | 'right', size: string): string {
    return getRTLSpacingClass(this.locale, property, side, size);
  }
  
  getFloatClass(float: 'left' | 'right'): string {
    return getRTLFloatClass(this.locale, float);
  }
  
  getTextAlignClass(align: 'left' | 'right' | 'center' | 'justify'): string {
    return getRTLTextAlignClass(this.locale, align);
  }
  
  formatText(text: string): string {
    return formatBidiText(text, this.locale);
  }
  
  applyStyles(styles: Record<string, any>): Record<string, any> {
    return applyRTLStyles(this.locale, styles);
  }
  
  getIconRotation(icon: 'arrow-left' | 'arrow-right' | 'chevron-left' | 'chevron-right'): string {
    return getRTLIconRotation(this.locale, icon);
  }
  
  getCSSProperties(): Record<string, string> {
    return createRTLCSSProperties(this.locale);
  }
}

/**
 * React hook for RTL utilities
 */
export function useRTL(locale: string) {
  return new RTLUtils(locale);
}

/**
 * Log RTL configuration for debugging
 */
export function logRTLConfig(locale: string): void {
  const rtlUtils = new RTLUtils(locale);
  
  logger.info('RTL Configuration', {
    locale,
    isRTL: rtlUtils.isRTL,
    direction: rtlUtils.direction,
    isBidi: rtlUtils.isBidi,
    fontFamily: getLocaleFontFamily(locale),
    cssProperties: rtlUtils.getCSSProperties()
  });
}

export default {
  isRTLLocale,
  isBidiLocale,
  getTextDirection,
  getCSSDirection,
  getRTLClassNames,
  getRTLSpacingClass,
  getRTLFloatClass,
  getRTLTextAlignClass,
  applyRTLStyles,
  formatBidiText,
  cleanBidiText,
  getLocaleFontFamily,
  getRTLIconRotation,
  createRTLCSSProperties,
  RTLUtils,
  useRTL,
  logRTLConfig
};