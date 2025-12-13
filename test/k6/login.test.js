import { SharedArray } from 'k6/data';
import { group } from 'k6';
import { login } from './helpers/auth.js';

const loginData = new SharedArray('login data', function () {
  return JSON.parse(open('./data/login.test.data.json'));
});

export const options = {
  vus: 3,
  iterations: 3,
  thresholds: {
    http_req_duration: ['p(95) < 2000']
  }
};

export default function () {
  const data = loginData[__VU - 1];

  group('User Login with DDT', () => {
    login(data.email, data.password);
  });
}
