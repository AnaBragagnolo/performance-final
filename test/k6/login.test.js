import { SharedArray } from 'k6/data';
import { group } from 'k6';
import { login } from './helpers/auth.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';

const loginData = new SharedArray('login data', function () {
  return JSON.parse(open('./data/login.test.data.json'));
});

export const options = {
  stages: [
  { duration: '20s', target: 3 },
  { duration: '20s', target: 3 },
  { duration: '10s', target: 0 }
],
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

export function handleSummary(data) {
  return {
    'reports/login-report.html': htmlReport(data),
    'reports/login-summary.json': JSON.stringify(data)
  };
}


