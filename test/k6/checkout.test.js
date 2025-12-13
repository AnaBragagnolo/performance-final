import { group } from 'k6';
import { generateRandomEmail } from './helpers/email.js';
import { register, login, checkout } from './helpers/auth.js';

export const options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95) < 2000']
  }
};

export default function () {
  const email = generateRandomEmail();
  const password = 'senha123';
  const name = 'Test User';

  group('User Registration', () => {
    register(name, email, password);
  });

  group('User Login', () => {
    login(email, password);
  });

  group('Checkout Process', () => {
    const token = login(email, password);
    const items = [{ productId: 1, quantity: 1 }];
    const freight = 20;
    const paymentMethod = 'boleto';
    checkout(token, items, freight, paymentMethod);
  });
}
