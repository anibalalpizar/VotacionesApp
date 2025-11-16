import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 3,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],      // < 1% de fallos
    http_req_duration: ['p(95)<1000'],   // 95% bajo 1 segundo
  },
  insecureSkipTLSVerify: true,
};

const BASE_URL = __ENV.TARGET_URL || 'https://localhost:7290';

// Credenciales del usuario Admin de tus datos de prueba
const loginPayload = JSON.stringify({
  UserOrEmail: '123456789',  // Identification del Admin Principal
  Password: 'Admin123!'      // Ajusta según tu password real
});

const headers = {
  'Content-Type': 'application/json',
};

export default function () {
  const loginResponse = http.post(
    `${BASE_URL}/api/Auth/login`,
    loginPayload,
    { headers }
  );

  const loginOk = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response is JSON': (r) => 
      (r.headers['Content-Type'] || '').includes('application/json'),
    'login returns token': (r) => {
      if (r.status !== 200) return false;
      try {
        const body = JSON.parse(r.body);
        return body.token && body.token.length > 0;
      } catch {
        return false;
      }
    },
  });

  if (!loginOk) {
    console.error(`Login failed: status=${loginResponse.status}`);
    if (loginResponse.body) {
      console.error(`Response: ${loginResponse.body.substring(0, 200)}`);
    }
  }

  sleep(1);
}

export function setup() {
  console.log('='.repeat(60));
  console.log('SMOKE TEST - Sistema de Votaciones');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`VUs: ${options.vus}, Duration: ${options.duration}`);
  console.log(`Thresholds: < 1% fallos, 95% < 1s`);
  console.log('='.repeat(60));
}

export function teardown(data) {
  console.log('='.repeat(60));
  console.log('Smoke Test completado');
  console.log('Revisa que todos los thresholds pasaron ✓');
  console.log('='.repeat(60));
}