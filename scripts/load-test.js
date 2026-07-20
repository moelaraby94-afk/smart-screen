/**
 * Load testing script for Cloud-Screen backend API.
 * Requires k6 (https://k6.io/): k6 run scripts/load-test.js
 *
 * Usage:
 *   k6 run --env BASE_URL=http://localhost:3000 scripts/load-test.js
 *   k6 run --env BASE_URL=http://localhost:3000 --env VUS=50 --env DURATION=2m scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const VUS = parseInt(__ENV.VUS || '20', 10);
const DURATION = __ENV.DURATION || '1m';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const scheduleDuration = new Trend('schedule_duration');
const popDuration = new Trend('proof_of_play_duration');

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health is 200': (r) => r.status === 200,
  });

  // 2. Login (if test credentials provided)
  const email = __ENV.TEST_EMAIL || 'test@example.com';
  const password = __ENV.TEST_PASSWORD || 'password';

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'login status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(!loginOk);

  if (loginRes.status === 200) {
    const token = loginRes.json('accessToken');
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. List schedules
    const schedRes = http.get(
      `${BASE_URL}/customer/schedules?workspaceId=test-ws&limit=10`,
      { headers: authHeaders },
    );
    scheduleDuration.add(schedRes.timings.duration);
    check(schedRes, {
      'schedules status 200 or 403': (r) => r.status === 200 || r.status === 403,
    });

    // 4. Record proof-of-play
    const popRes = http.post(
      `${BASE_URL}/analytics/proof-of-play`,
      JSON.stringify({
        workspaceId: 'test-ws',
        screenId: 'test-screen',
        contentType: 'MEDIA',
        contentId: 'test-content',
        contentName: 'Test Content',
        durationSec: 10,
      }),
      { headers: authHeaders },
    );
    popDuration.add(popRes.timings.duration);
    check(popRes, {
      'proof-of-play status 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
  }

  // 5. Player telemetry (no auth required, uses player secret)
  const crashRes = http.post(
    `${BASE_URL}/player/telemetry/crash-report`,
    JSON.stringify({
      screenId: 'test-screen',
      stackTrace: 'Test crash for load testing',
      playerVersion: '1.0.0',
      platform: 'WEB',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(crashRes, {
    'crash-report accepted': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);
}
