/**
 * Real suite for src/utils/envValidation.ts (added 2026-10-16 ~5:40 PM ET loop).
 * Pure module: every test drives process.env and asserts on the exported functions' actual output.
 * Fake key values are built at runtime (repeat()) so nothing here resembles a real secret.
 */
import {
  API_KEY_CONFIGS,
  validateEnvironment,
  validateEnvironmentVariables,
  validateApiKey,
  getEnvironmentByCategory,
  getEnvironmentStatus,
  getApiKeyConfig,
  maskApiKey,
  isProductionReady,
  logEnvironmentStatus,
} from '../envValidation';

const ALL_KEYS = Object.keys(API_KEY_CONFIGS);
const REQUIRED_KEYS = ALL_KEYS.filter((k) => API_KEY_CONFIGS[k].required);
const OPTIONAL_KEYS = ALL_KEYS.filter((k) => !API_KEY_CONFIGS[k].required);

// Well-formed fake values that satisfy each validator and contain no placeholder marker.
const GOOD: Record<string, string> = {
  OPENAI_API_KEY: 'sk-' + 'a'.repeat(30),
  DEEPSEEK_API_KEY: 'sk-' + 'b'.repeat(30),
  GOOGLE_TRANSLATE_API_KEY: 'g'.repeat(24),
  AZURE_TRANSLATE_API_KEY: 'z'.repeat(24),
  DEEPL_API_KEY: 'd'.repeat(24),
  AWS_TRANSLATE_ACCESS_KEY: 'w'.repeat(24),
  CANVA_API_KEY: 'c'.repeat(24),
  CANVA_CLIENT_ID: 'i'.repeat(24),
  GOOGLE_SSO_CLIENT_ID: '1234-abc.apps.googleusercontent.com',
  NEXTAUTH_SECRET: 's'.repeat(40),
  SUPABASE_URL: 'https://proj.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ' + 'k'.repeat(120),
  CANVAS_LTI_CONSUMER_KEY: 'l'.repeat(24),
  SENDGRID_API_KEY: 'SG.' + 'm'.repeat(30),
};

const env = process.env as Record<string, string | undefined>;
const ORIGINAL_ENV = { ...process.env };

function clearConfiguredKeys() {
  ALL_KEYS.forEach((k) => {
    delete env[k];
  });
}

function setAll(values: Record<string, string>) {
  Object.entries(values).forEach(([k, v]) => {
    env[k] = v;
  });
}

beforeEach(() => {
  clearConfiguredKeys();
});

afterAll(() => {
  clearConfiguredKeys();
  Object.assign(process.env, ORIGINAL_ENV);
});

describe('API_KEY_CONFIGS', () => {
  it('keys each config by its own key name', () => {
    ALL_KEYS.forEach((k) => expect(API_KEY_CONFIGS[k].key).toBe(k));
  });

  it('marks exactly the four core keys as required', () => {
    expect(REQUIRED_KEYS.sort()).toEqual(
      ['NEXTAUTH_SECRET', 'OPENAI_API_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_URL'].sort()
    );
  });

  it('accepts every GOOD fixture with its own validator', () => {
    ALL_KEYS.forEach((k) => {
      expect(GOOD[k]).toBeDefined();
      expect(API_KEY_CONFIGS[k].validator!(GOOD[k])).toBe(true);
    });
  });

  it.each([
    ['OPENAI_API_KEY', 'pk-' + 'a'.repeat(30)],
    ['OPENAI_API_KEY', 'sk-short'],
    ['NEXTAUTH_SECRET', 's'.repeat(31)],
    ['SUPABASE_URL', 'http://proj.supabase.co'],
    ['SUPABASE_URL', 'https://proj.firebaseio.com'],
    ['SUPABASE_ANON_KEY', 'eyJ' + 'k'.repeat(50)],
    ['SUPABASE_ANON_KEY', 'abc' + 'k'.repeat(120)],
    ['SENDGRID_API_KEY', 'XX.' + 'm'.repeat(30)],
    ['GOOGLE_TRANSLATE_API_KEY', 'short'],
    ['GOOGLE_SSO_CLIENT_ID', 'tooshort'],
  ])('rejects malformed %s value', (k, v) => {
    expect(API_KEY_CONFIGS[k].validator!(v)).toBe(false);
  });
});

describe('validateEnvironment', () => {
  it('is invalid with every required key listed as missing when nothing is set', () => {
    const r = validateEnvironment();
    expect(r.isValid).toBe(false);
    expect(r.missingKeys.sort()).toEqual([...REQUIRED_KEYS].sort());
    expect(r.errors).toHaveLength(REQUIRED_KEYS.length);
    r.errors.forEach((e) => expect(e).toMatch(/^Missing required environment variable: /));
    expect(r.warnings).toHaveLength(OPTIONAL_KEYS.length);
    r.warnings.forEach((w) => expect(w).toMatch(/^Optional environment variable not set: /));
    expect(r.invalidKeys).toEqual([]);
  });

  it('is valid with no errors or warnings when every key is well formed', () => {
    setAll(GOOD);
    const r = validateEnvironment();
    expect(r).toEqual({ isValid: true, missingKeys: [], invalidKeys: [], warnings: [], errors: [] });
  });

  it('is valid with only the required keys set, warning about each optional key', () => {
    REQUIRED_KEYS.forEach((k) => (env[k] = GOOD[k]));
    const r = validateEnvironment();
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(OPTIONAL_KEYS.length);
  });

  it('flags a malformed key as invalid and fails validation', () => {
    setAll(GOOD);
    env.SENDGRID_API_KEY = 'not-a-sendgrid-key-000';
    const r = validateEnvironment();
    expect(r.isValid).toBe(false);
    expect(r.invalidKeys).toEqual(['SENDGRID_API_KEY']);
    expect(r.errors).toEqual([expect.stringMatching(/^Invalid format for SENDGRID_API_KEY: /)]);
  });

  it.each(['your-', 'replace-', 'example'])('warns on a "%s" placeholder in a well-formed key', (marker) => {
    setAll(GOOD);
    env.OPENAI_API_KEY = 'sk-' + marker + 'a'.repeat(30);
    const r = validateEnvironment();
    expect(r.invalidKeys).toEqual(['OPENAI_API_KEY']);
    expect(r.warnings).toEqual(['OPENAI_API_KEY appears to contain a placeholder value']);
    // CURRENT BEHAVIOR (finding, not changed here): a placeholder that passes the format validator only
    // warns, so validateEnvironment still reports isValid true for a placeholder required key.
    // isProductionReady and validateApiKey do treat it as a failure (see below).
    expect(r.isValid).toBe(true);
  });

  it('lists a key twice in invalidKeys when it is both malformed and a placeholder (current behavior)', () => {
    setAll(GOOD);
    env.GOOGLE_TRANSLATE_API_KEY = 'your-google-key';
    const r = validateEnvironment();
    expect(r.isValid).toBe(false);
    expect(r.invalidKeys).toEqual(['GOOGLE_TRANSLATE_API_KEY', 'GOOGLE_TRANSLATE_API_KEY']);
    expect(r.errors).toHaveLength(1);
    expect(r.warnings).toHaveLength(1);
  });

  it('exposes validateEnvironmentVariables as the same function', () => {
    expect(validateEnvironmentVariables).toBe(validateEnvironment);
  });
});

describe('validateApiKey', () => {
  it('rejects an unknown key name', () => {
    expect(validateApiKey('NOPE_KEY', 'whatever')).toEqual({ isValid: false, error: 'Unknown API key: NOPE_KEY' });
  });

  it('rejects an empty value', () => {
    expect(validateApiKey('OPENAI_API_KEY', '')).toEqual({ isValid: false, error: 'OPENAI_API_KEY is required' });
  });

  it('rejects a malformed value', () => {
    expect(validateApiKey('SUPABASE_URL', 'http://x.supabase.co')).toEqual({
      isValid: false,
      error: 'Invalid format for SUPABASE_URL',
    });
  });

  it('rejects a well-formed placeholder value', () => {
    expect(validateApiKey('NEXTAUTH_SECRET', 'replace-' + 's'.repeat(40))).toEqual({
      isValid: false,
      error: 'NEXTAUTH_SECRET appears to contain a placeholder value',
    });
  });

  it('accepts every GOOD fixture', () => {
    ALL_KEYS.forEach((k) => expect(validateApiKey(k, GOOD[k])).toEqual({ isValid: true }));
  });
});

describe('getEnvironmentByCategory / getApiKeyConfig', () => {
  it('groups every config exactly once under its category', () => {
    const cats = getEnvironmentByCategory();
    const flattened = Object.values(cats).flat();
    expect(flattened).toHaveLength(ALL_KEYS.length);
    Object.entries(cats).forEach(([cat, configs]) => configs.forEach((c) => expect(c.category).toBe(cat)));
    expect(cats['Translation Services'].map((c) => c.key)).toEqual([
      'GOOGLE_TRANSLATE_API_KEY',
      'AZURE_TRANSLATE_API_KEY',
      'DEEPL_API_KEY',
      'AWS_TRANSLATE_ACCESS_KEY',
    ]);
  });

  it('getApiKeyConfig returns the config table', () => {
    expect(getApiKeyConfig()).toBe(API_KEY_CONFIGS);
  });
});

describe('maskApiKey', () => {
  it('fully masks keys of 8 characters or fewer', () => {
    expect(maskApiKey('')).toBe('');
    expect(maskApiKey('abc')).toBe('***');
    expect(maskApiKey('12345678')).toBe('********');
  });

  it('keeps the first and last 4 characters of longer keys', () => {
    expect(maskApiKey('123456789')).toBe('1234*6789');
    expect(maskApiKey('abcdEFGHIJKLwxyz')).toBe('abcd********wxyz');
  });

  it('never leaks the middle of a key and preserves length', () => {
    const key = GOOD.SUPABASE_ANON_KEY;
    const masked = maskApiKey(key);
    expect(masked).toHaveLength(key.length);
    expect(masked.slice(4, -4)).toMatch(/^\*+$/);
  });
});

describe('getEnvironmentStatus', () => {
  it('reports unset keys as unconfigured, invalid, with no masked value', () => {
    const s = getEnvironmentStatus();
    expect(Object.keys(s).sort()).toEqual([...ALL_KEYS].sort());
    ALL_KEYS.forEach((k) => {
      expect(s[k]).toEqual({
        configured: false,
        valid: false,
        required: API_KEY_CONFIGS[k].required,
        maskedValue: undefined,
      });
    });
  });

  it('reports configured keys with validity and a masked (never raw) value', () => {
    setAll(GOOD);
    env.DEEPL_API_KEY = 'your-deepl-key-0000';
    const s = getEnvironmentStatus();
    expect(s.OPENAI_API_KEY).toEqual({
      configured: true,
      valid: true,
      required: true,
      maskedValue: maskApiKey(GOOD.OPENAI_API_KEY),
    });
    expect(s.DEEPL_API_KEY.configured).toBe(true);
    expect(s.DEEPL_API_KEY.valid).toBe(false);
    ALL_KEYS.forEach((k) => {
      expect(s[k].value).toBeUndefined();
      expect(s[k].maskedValue).not.toBe(env[k]);
    });
  });
});

describe('isProductionReady', () => {
  const originalNodeEnv = env.NODE_ENV;
  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
  });

  it('is ready only with every key valid and NODE_ENV=production', () => {
    setAll(GOOD);
    env.NODE_ENV = 'production';
    expect(isProductionReady()).toEqual({ ready: true, issues: [] });
  });

  it('reports the NODE_ENV issue outside production', () => {
    setAll(GOOD);
    env.NODE_ENV = 'test';
    expect(isProductionReady()).toEqual({ ready: false, issues: ['NODE_ENV is not set to production'] });
  });

  it('lists missing required keys', () => {
    env.NODE_ENV = 'production';
    const r = isProductionReady();
    expect(r.ready).toBe(false);
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0]).toMatch(/^Missing required API keys: /);
    REQUIRED_KEYS.forEach((k) => expect(r.issues[0]).toContain(k));
  });

  it('treats a well-formed placeholder as not production ready', () => {
    setAll(GOOD);
    env.NODE_ENV = 'production';
    env.OPENAI_API_KEY = 'sk-your-' + 'a'.repeat(30);
    expect(isProductionReady()).toEqual({ ready: false, issues: ['Invalid API keys: OPENAI_API_KEY'] });
  });
});

describe('logEnvironmentStatus', () => {
  let logSpy: jest.SpyInstance;
  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
  });

  const lines = () => logSpy.mock.calls.map((c) => String(c[0]));

  it('logs errors, warnings and a per-category listing when keys are missing', () => {
    logEnvironmentStatus();
    const out = lines();
    expect(out).toContain('✅ Valid: false');
    expect(out).toContain('❌ Errors:');
    expect(out).toContain('⚠️  Warnings:');
    expect(out).toContain('  ❌ OPENAI_API_KEY (required)');
    expect(out).toContain('  ⚠️ DEEPSEEK_API_KEY (optional)');
    Object.keys(getEnvironmentByCategory()).forEach((cat) => expect(out).toContain(`\n📁 ${cat}:`));
  });

  it('omits the error and warning sections when everything is valid, and never prints raw values', () => {
    setAll(GOOD);
    logEnvironmentStatus();
    const out = lines();
    expect(out).toContain('✅ Valid: true');
    expect(out).not.toContain('❌ Errors:');
    expect(out).not.toContain('⚠️  Warnings:');
    expect(out).toContain('  ✅ SENDGRID_API_KEY (optional)');
    const joined = out.join('\n');
    Object.values(GOOD).forEach((v) => expect(joined).not.toContain(v));
  });
});
