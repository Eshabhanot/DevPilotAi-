import { apiClient } from './apiClient';

/**
 * Knowledge Service API calls routed through API Gateway (/api/knowledge)
 */
export const knowledgeApi = {
  /**
   * List documents currently registered by the knowledge service
   * @returns {Promise<Array>}
   */
  async listDocuments() {
    const response = await apiClient.get('/api/knowledge/documents');
    return response.data || [];
  },

  /**
   * Upload a PDF file to the knowledge base
   * @param {File} file - PDF file object
   * @returns {Promise<Object>} - Ingestion result { message, title, chunksStored }
   */
  async uploadPdf(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/knowledge/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return response.data;
  },

  /**
   * Ask a question using RAG against the knowledge base
   * @param {string} question
   * @param {Array<string>} conversationHistory
   * @returns {Promise<Object>} RagAnswerResponse { question, answer, sources }
   */
  async askQuestion(question, conversationHistory = []) {
    const response = await apiClient.post('/api/knowledge/ask', {
      question: question?.trim(),
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
    });
    return response.data;
  },

  /**
   * Perform semantic search across indexed documents
   * @param {string} question
   * @param {Array<string>} conversationHistory
   * @returns {Promise<Object>} KnowledgeSearchResponse
   */
  async search(question, conversationHistory = []) {
    const response = await apiClient.post('/api/knowledge/query/search', {
      question: question?.trim(),
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
    });
    return response.data;
  },

  /**
   * Health check for knowledge service
   */
  async checkHealth() {
    try {
      const response = await apiClient.get('/api/knowledge/actuator/health');
      return response.status === 200;
    } catch {
      return false;
    }
  },
};
