import { sleep } from 'k6';
import { check } from 'k6';
import { Rate } from 'k6/metrics';
import ws from 'k6/ws';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'wss://aqualyn.onrender.com';

export const options = {
  stages: [
    { duration: '30s', target: 100   },  // 100 concurrent socket connections
    { duration: '1m',  target: 100   },
    { duration: '30s', target: 500   },  // 500 connections
    { duration: '1m',  target: 500   },
    { duration: '30s', target: 2000  },  // 2K connections ← Socket.IO will struggle here
    { duration: '1m',  target: 2000  },
    { duration: '30s', target: 5000  },  // 5K ← Redis adapter becomes critical here
    { duration: '30s', target: 0     },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    ws_session_duration: ['p(95)<30000'],
  },
};

export default function () {
  const userId = `loadtest-user-${__VU}-${__ITER}`;

  const res = ws.connect(
    `${BASE_URL}/socket.io/?EIO=4&transport=websocket`,
    {},
    function (socket) {
      socket.on('open', () => {
        // Socket.IO protocol requires 42 prefix before the JSON array: 4 (Engine.IO message) + 2 (Socket.IO event)
        const payload = `42["join_room",{"userId":"${userId}"}]`;
        socket.send(payload);
      });

      socket.on('message', (data) => {
        check(data, { 'received message': (d) => d !== null });
      });

      socket.on('error', (e) => {
        errorRate.add(1);
      });

      // Stay connected for 10s (simulate real user session)
      sleep(10);
      socket.close();
    }
  );

  check(res, { 'socket connected': (r) => r && r.status === 101 }) || errorRate.add(1);

  sleep(1);
}
