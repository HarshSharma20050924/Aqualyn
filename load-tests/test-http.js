import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const chatListDuration = new Trend('chat_list_duration');

// ── Target server ─────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://aqualyn.onrender.com';

// ── Load stages (change VUs to push further) ──────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 100   },  // ramp to 100 users
    { duration: '1m',  target: 100   },  // hold 100 for 1 min
    { duration: '30s', target: 500   },  // ramp to 500
    { duration: '1m',  target: 500   },  // hold 500
    { duration: '30s', target: 1000  },  // ramp to 1K
    { duration: '1m',  target: 1000  },  // hold 1K
    { duration: '30s', target: 5000  },  // ramp to 5K ← find the wall here
    { duration: '1m',  target: 5000  },  // hold 5K
    { duration: '30s', target: 0     },  // ramp down
  ],
  thresholds: {
    // Alert if >1% requests fail
    errors: ['rate<0.01'],
    // Alert if 95th percentile response > 2s
    http_req_duration: ['p(95)<2000'],
  },
};

// ── Test scenarios ────────────────────────────────────────────────────
export default function () {

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. User search (no auth needed — hits DB)
  const searchRes = http.get(`${BASE_URL}/api/users/search?q=a`);
  const searchOk = check(searchRes, {
    'search: status 200': (r) => r.status === 200,
    'search: returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });
  errorRate.add(!searchOk);

  sleep(1);
}
