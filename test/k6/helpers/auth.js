import http from 'k6/http';
import { check } from 'k6';
import { getBaseURL } from './config.js';
import { Trend } from 'k6/metrics';

const registerTrend = new Trend('register_duration');
const loginTrend = new Trend('login_duration');
const checkoutTrend = new Trend('checkout_duration');

/**
 * Registra um novo usuário
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} Resposta do registro
 */
export function register(name, email, password) {
  const baseURL = getBaseURL();
  const url = `${baseURL}/api/users/register`;
  const payload = JSON.stringify({ name, email, password });

  const response = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  registerTrend.add(response.timings.duration);

  check(response, {
    'register: status code is 201': (r) => r.status === 201
  });

  return response;
}

/**
 * Faz login do usuário
 * @param {string} email
 * @param {string} password
 * @returns {string} Token JWT do usuário
 */
export function login(email, password) {
  const baseURL = getBaseURL();
  const url = `${baseURL}/api/users/login`;
  const payload = JSON.stringify({ email, password });

  const response = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  loginTrend.add(response.timings.duration);

  check(response, {
    'login: status code is 200': (r) => r.status === 200
  });

  const body = response.json();
  return body?.token || null;
}

/**
 * Realiza o checkout
 * @param {string} token
 * @param {Array} items
 * @param {number} freight
 * @param {string} paymentMethod
 * @returns {Object} Resposta do checkout
 */
export function checkout(token, items, freight, paymentMethod) {
  const baseURL = getBaseURL();
  const url = `${baseURL}/api/checkout`;
  const payload = JSON.stringify({ items, freight, paymentMethod });

  const response = http.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  checkoutTrend.add(response.timings.duration);

  check(response, {
    'checkout: status code is 200': (r) => r.status === 200
  });

  return response;
}
