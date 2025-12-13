/**
 * Obter a URL base da API
 * @returns {string} URL base da API
 */
export function getBaseURL() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}
