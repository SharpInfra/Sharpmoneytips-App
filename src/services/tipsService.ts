import { apiClient } from './apiClient';

export const tipsService = {
  async runPipeline(brandId: string = 'sharpmoney') {
    return apiClient.post('/pipeline/run-pipeline', { brandId });
  },

  async getTips() {
    return apiClient.get('/tips');
  },
};
