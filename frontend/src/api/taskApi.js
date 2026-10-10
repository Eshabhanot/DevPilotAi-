import { apiClient } from './apiClient';

/**
 * AI Orchestrator Task API calls routed through API Gateway
 */
export const taskApi = {
  /**
   * Submit a new software change task
   * @param {Object} data - { task, workspaceId, conversationHistory }
   * @returns {Promise<Object>} TaskResponse
   */
  async createTask({ task, workspaceId, conversationHistory = [] }) {
    try {
      const response = await apiClient.post('/api/tasks', {
        task: task?.trim(),
        workspaceId: workspaceId?.trim(),
        conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      });
      return response.data;
    } catch (err) {
      // Fallback route check in case gateway was configured with /api/orchestrator/tasks
      if (err.response?.status === 404) {
        const fallback = await apiClient.post('/api/orchestrator/tasks', {
          task: task?.trim(),
          workspaceId: workspaceId?.trim(),
          conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
        });
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * Get task details by taskId
   * @param {string} taskId
   * @returns {Promise<Object>} TaskResponse
   */
  async getTask(taskId) {
    try {
      const response = await apiClient.get(`/api/tasks/${taskId}`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 && !err.response?.data?.message?.includes('Task not found')) {
        const fallback = await apiClient.get(`/api/orchestrator/tasks/${taskId}`);
        return fallback.data;
      }
      throw err;
    }
  },

  /**
   * List all tasks for current authenticated owner
   * @returns {Promise<Array>} List of TaskResponse
   */
  async listTasks() {
    try {
      const response = await apiClient.get('/api/tasks');
      return response.data || [];
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await apiClient.get('/api/orchestrator/tasks');
        return fallback.data || [];
      }
      throw err;
    }
  },

  /**
   * Cancel an in-flight task
   * @param {string} taskId
   * @returns {Promise<Object>} TaskResponse
   */
  async cancelTask(taskId) {
    try {
      const response = await apiClient.post(`/api/tasks/${taskId}/cancel`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallback = await apiClient.post(`/api/orchestrator/tasks/${taskId}/cancel`);
        return fallback.data;
      }
      throw err;
    }
  },
};
