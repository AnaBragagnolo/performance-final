/**
 * Gera um email aleatório único
 * @returns {string} Email gerado
 */
export function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `user_${timestamp}_${random}@test.com`;
}
