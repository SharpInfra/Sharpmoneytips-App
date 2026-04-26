/**
 * UI config service
 * Server-driven home UI configuration with validation and fallback.
 */

import { StorageService, STORAGE_KEYS } from './storage';
import { decisionApiService } from './decisionApiService';

export type HomeSectionKey = 'heroTip' | 'topTips' | 'ctaBanner';
export type HomeStrategy = 'maximize_engagement' | 'maximize_conversion' | 'minimize_risk';

export interface HomeSectionDecision {
  type: HomeSectionKey;
  score: number;
  reason: string;
}

export type HomeFeatures = {
  showOdds: boolean;
  highlightVIP: boolean;
};

export interface HomeUIConfig {
  sections: HomeSectionDecision[];
  strategy: HomeStrategy;
  features: HomeFeatures;
  sectionFlags?: Partial<Record<HomeSectionKey, string>>;
}

export interface UIConfig {
  tenantId: string;
  home: HomeUIConfig;
  userSegment: string | null;
  branding: {
    appName: string;
    primaryColor: string;
    logoUrl: string | null;
  };
}

type UIConfigResponse = Partial<UIConfig>;

const VALID_HOME_SECTIONS: HomeSectionKey[] = ['heroTip', 'topTips', 'ctaBanner'];

const DEFAULT_UI_CONFIG: UIConfig = {
  tenantId: 'default',
  home: {
    sections: [
      { type: 'heroTip', score: 0.9, reason: 'default_primary_signal' },
      { type: 'ctaBanner', score: 0.7, reason: 'default_conversion' },
      { type: 'topTips', score: 0.6, reason: 'default_secondary_signal' },
    ],
    strategy: 'maximize_engagement',
    features: {
      showOdds: true,
      highlightVIP: true,
    },
    sectionFlags: {},
  },
  userSegment: null,
  branding: {
    appName: 'MR. SHARPMONEY',
    primaryColor: '#2DC5A2',
    logoUrl: null,
  },
};

const isHomeSection = (value: unknown): value is HomeSectionKey => {
  return typeof value === 'string' && VALID_HOME_SECTIONS.includes(value as HomeSectionKey);
};

const isHomeStrategy = (value: unknown): value is HomeStrategy => {
  return value === 'maximize_engagement' || value === 'maximize_conversion' || value === 'minimize_risk';
};

const normalizeScore = (value: unknown): number => {
  const raw = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(raw)) {
    return 0;
  }

  return Math.max(0, Math.min(1, raw));
};

const sanitizeSectionTypes = (value: unknown, fallback: HomeSectionKey[]): HomeSectionKey[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const sanitized = value.filter((item): item is HomeSectionKey => isHomeSection(item));
  if (sanitized.length === 0) {
    return fallback;
  }

  return Array.from(new Set(sanitized));
};

const dedupeBestScore = (sections: HomeSectionDecision[]): HomeSectionDecision[] => {
  const byType = new Map<HomeSectionKey, HomeSectionDecision>();

  for (const section of sections) {
    const existing = byType.get(section.type);
    if (!existing || section.score > existing.score) {
      byType.set(section.type, section);
    }
  }

  return [...byType.values()];
};

const sanitizeDecisionSections = (
  value: unknown,
  fallback: HomeSectionDecision[],
): HomeSectionDecision[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const sanitized = value
    .map((item): HomeSectionDecision | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      if (!isHomeSection(candidate['type'])) {
        return null;
      }

      return {
        type: candidate['type'],
        score: normalizeScore(candidate['score']),
        reason: typeof candidate['reason'] === 'string' && candidate['reason'].length > 0
          ? candidate['reason']
          : 'unspecified',
      };
    })
    .filter((section): section is HomeSectionDecision => section !== null);

  if (sanitized.length === 0) {
    return fallback;
  }

  return dedupeBestScore(sanitized);
};

const sanitizeFeatures = (value: unknown, fallback: HomeFeatures): HomeFeatures => {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const candidate = value as Partial<HomeFeatures>;
  return {
    showOdds: typeof candidate.showOdds === 'boolean' ? candidate.showOdds : fallback.showOdds,
    highlightVIP: typeof candidate.highlightVIP === 'boolean' ? candidate.highlightVIP : fallback.highlightVIP,
  };
};

const sanitizeSectionFlags = (value: unknown): Partial<Record<HomeSectionKey, string>> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const flags = value as Record<string, unknown>;
  const next: Partial<Record<HomeSectionKey, string>> = {};

  for (const section of VALID_HOME_SECTIONS) {
    const raw = flags[section];
    if (typeof raw === 'string' && raw.length > 0) {
      next[section] = raw;
    }
  }

  return next;
};

const toLegacyDecisions = (layout: HomeSectionKey[], order: HomeSectionKey[]): HomeSectionDecision[] => {
  const ranked = order.length > 0 ? order : layout;
  return ranked.map((type, index) => ({
    type,
    score: Math.max(0.1, 1 - index * 0.1),
    reason: 'legacy_layout_migration',
  }));
};

const mergeUIConfig = (remote: UIConfigResponse | null, cached: UIConfig | null): UIConfig => {
  const base = cached ?? DEFAULT_UI_CONFIG;
  const remoteHome = (remote?.home ?? {}) as Record<string, unknown>;

  const fallbackLegacyLayout = base.home.sections.map((section) => section.type);
  const legacyLayout = sanitizeSectionTypes(remoteHome['layout'], fallbackLegacyLayout);
  const legacyOrder = sanitizeSectionTypes(remoteHome['order'], fallbackLegacyLayout).filter((section) => legacyLayout.includes(section));
  const legacyDecisions = toLegacyDecisions(legacyLayout, legacyOrder);

  const sections = sanitizeDecisionSections(remoteHome['sections'], legacyDecisions.length > 0 ? legacyDecisions : base.home.sections);
  const strategy = isHomeStrategy(remoteHome['strategy']) ? remoteHome['strategy'] : base.home.strategy;

  return {
    tenantId: typeof remote?.tenantId === 'string' && remote.tenantId.length > 0
      ? remote.tenantId
      : base.tenantId,
    home: {
      sections,
      strategy,
      features: sanitizeFeatures(remoteHome['features'], base.home.features),
      sectionFlags: {
        ...(base.home.sectionFlags ?? {}),
        ...sanitizeSectionFlags(remoteHome['sectionFlags']),
      },
    },
    userSegment: typeof remote?.userSegment === 'string' ? remote.userSegment : base.userSegment,
    branding: {
      appName: typeof remote?.branding?.appName === 'string' && remote.branding.appName.length > 0
        ? remote.branding.appName
        : base.branding.appName,
      primaryColor: typeof remote?.branding?.primaryColor === 'string' && remote.branding.primaryColor.length > 0
        ? remote.branding.primaryColor
        : base.branding.primaryColor,
      logoUrl: typeof remote?.branding?.logoUrl === 'string' ? remote.branding.logoUrl : base.branding.logoUrl,
    },
  };
};

const normalizeUIConfigPayload = (input: unknown, cached: UIConfig | null): UIConfig | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  return mergeUIConfig(input as UIConfigResponse, cached);
};

export const uiConfigService = {
  getDefaultConfig(): UIConfig {
    return DEFAULT_UI_CONFIG;
  },

  async getConfig(tenantId: string): Promise<UIConfig> {
    const cached = await StorageService.getItem<UIConfig>(STORAGE_KEYS.UI_CONFIG);

    try {
      const payload = await decisionApiService.getUIConfig(tenantId);

      if (!payload) {
        return cached ?? DEFAULT_UI_CONFIG;
      }

      const merged = mergeUIConfig(payload as UIConfigResponse, cached);
      await StorageService.setItem(STORAGE_KEYS.UI_CONFIG, merged);
      return merged;
    } catch (error) {
      console.error('[UIConfig] Failed to fetch UI config:', error);
      return cached ?? DEFAULT_UI_CONFIG;
    }
  },

  normalizePayload(input: unknown, cached: UIConfig | null): UIConfig | null {
    return normalizeUIConfigPayload(input, cached);
  },
};
