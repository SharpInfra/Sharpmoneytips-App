import { apiClient } from './apiClient';
import { getErrorMessage } from '@utils/errors';

type TipRecord = {
  id: string;
  matchId: string;
  targetTeam: string;
  betType: string;
  betOption: string | null;
  odds: number;
  probability: number;
  ev: number;
  roi: number;
  strategyTag: string;
  riskLevel: string | null;
  packageName: string | null;
  showToUser: boolean;
  status: string;
  result: string;
  brandId: string;
  marketRegion: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type PipelineResponse = {
  savedTips?: TipRecord[];
};

type TipsResult = {
  tips: TipRecord[];
  error: string | null;
  isNetworkError: boolean;
};

const mapTipsError = (errorCode?: string, fallbackMessage?: string): string => {
  if (!errorCode) {
    return fallbackMessage ?? getErrorMessage('UNKNOWN');
  }

  if (errorCode === 'NETWORK_ERROR') {
    return 'No internet connection. Pull to retry when back online.';
  }

  return fallbackMessage ?? getErrorMessage('UNKNOWN');
};

export const tipsService = {
  async runPipeline(brandId: string = 'sharpmoney') {
    return apiClient.post('/pipeline/run-pipeline', { brandId });
  },

  async getTips() {
    return apiClient.get('/tips');
  },

  async fetchVisibleTips(brandId: string = 'sharpmoney'): Promise<TipsResult> {
    const response = await apiClient.post<PipelineResponse>('/pipeline/run-pipeline', { brandId });

    if (response.error) {
      return {
        tips: [],
        error: mapTipsError(response.error.code, response.error.message),
        isNetworkError: response.error.code === 'NETWORK_ERROR',
      };
    }

    const savedTips = response.data?.savedTips ?? [];
    const visibleTips = savedTips.filter((tip) => tip.packageName !== 'Discarded');

    return {
      tips: visibleTips,
      error: null,
      isNetworkError: false,
    };
  },
};
