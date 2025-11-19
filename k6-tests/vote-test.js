import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

//#region Custom Metrics
const errorRate = new Rate('errors');
const voteSuccessRate = new Rate('vote_success');
const loginDuration = new Trend('login_duration');
const candidatesQueryDuration = new Trend('candidates_query_duration');
const voteCastDuration = new Trend('vote_cast_duration');
//#endregion

//#region Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
    'http_req_duration{expected_response:true}': ['p(99)<3000'],
    login_duration: ['p(95)<1500'],
    candidates_query_duration: ['p(95)<1200'],
    vote_cast_duration: ['p(95)<2500'],
    errors: ['rate<0.15'],
    vote_success: ['rate>0.5'],
  },
  insecureSkipTLSVerify: true,
};
//#endregion

//#region Configuration
const BASE_URL = __ENV.TARGET_URL || 'https://localhost:7290';
const MAX_GENERATED_USERS = 500;

const headers = {
  'Content-Type': 'application/json',
};

function generateVoterPool() {
  const pool = [];
  
  const baseVoters = [
    '987654321', '456789123', '111222333', '444555666',
    '777888999', '555444333', '222111000', '999888777'
  ];
  
  baseVoters.forEach(id => {
    pool.push({ id, password: 'Admin123!' });
  });
  
  for (let i = 1; i <= MAX_GENERATED_USERS; i++) {
    const paddedNumber = String(i).padStart(8, '0');
    const identification = '1' + paddedNumber;
    pool.push({ 
      id: identification, 
      password: 'Admin123!' 
    });
  }
  
  return pool;
}

const voters = generateVoterPool();
//#endregion

//#region Setup
export function setup() {
  console.log('='.repeat(60));
  console.log('🗳️  VOTE TEST - HU6 (Vote Casting)');
  console.log('='.repeat(60));
  console.log(`📍 Target URL: ${BASE_URL}`);
  console.log(`👥 Voter pool: ${voters.length}`);
  console.log(`⏱️  Total duration: ~3.5 minutes`);
  console.log(`📊 Max load: 20 concurrent users`);
  console.log('='.repeat(60));
  console.log('🔍 Validating system connectivity...');

  const loginPayload = JSON.stringify({
    UserOrEmail: voters[0].id,
    Password: voters[0].password
  });

  const loginRes = http.post(
    `${BASE_URL}/api/Auth/login`,
    loginPayload,
    { headers, timeout: '10s' }
  );

  if (loginRes.status !== 200) {
    console.error('❌ ERROR: Initial login failed');
    console.error(`   Status: ${loginRes.status}`);
    if (loginRes.body) {
      console.error(`   Response: ${loginRes.body.substring(0, 300)}`);
    }
    return { error: 'Login failed', message: 'Unable to authenticate' };
  }

  console.log('✅ Connectivity validated successfully');
  console.log('='.repeat(60));
  console.log('🚀 Starting load tests...');
  console.log('='.repeat(60));

  return { status: 'ok' };
}
//#endregion

//#region Main Test Flow
export default function (data) {
  if (data.error) {
    console.error(`❌ Setup failed: ${data.error}`);
    errorRate.add(1);
    return;
  }

  const voter = voters[Math.floor(Math.random() * voters.length)];
  let authToken = null;

  //#region Login
  group('1. Voter login', function () {
    const loginPayload = JSON.stringify({
      UserOrEmail: voter.id,
      Password: voter.password
    });

    const startLogin = Date.now();
    const loginRes = http.post(
      `${BASE_URL}/api/Auth/login`,
      loginPayload,
      { headers, timeout: '10s', tags: { name: 'Login' } }
    );
    const loginTime = Date.now() - startLogin;
    loginDuration.add(loginTime);

    const loginOk = check(loginRes, {
      'login: status 200': (r) => r.status === 200,
      'login: has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined && body.token.length > 0;
        } catch {
          return false;
        }
      },
      'login: response < 2s': () => loginTime < 2000,
    });

    if (!loginOk) {
      errorRate.add(1);
      console.error(`❌ Login failed for ${voter.id}: status=${loginRes.status}`);
      return;
    }

    try {
      const loginData = JSON.parse(loginRes.body);
      authToken = loginData.token;
    } catch (e) {
      errorRate.add(1);
      console.error(`❌ Error parsing token: ${e}`);
      return;
    }
  });

  if (!authToken) return;

  sleep(0.5 + Math.random());
  //#endregion

  //#region Query Candidates
  let electionsWithCandidates = [];

  group('2. Query candidates', function () {
    const startQuery = Date.now();
    const candidatesRes = http.get(
      `${BASE_URL}/api/public/candidates/active`,
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${authToken}`
        },
        timeout: '10s',
        tags: { name: 'GetCandidates' }
      }
    );
    const queryTime = Date.now() - startQuery;
    candidatesQueryDuration.add(queryTime);

    const candidatesOk = check(candidatesRes, {
      'candidates: status 200': (r) => r.status === 200,
      'candidates: is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
      'candidates: has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) && body.length > 0;
        } catch {
          return false;
        }
      },
      'candidates: response < 1.5s': () => queryTime < 1500,
    });

    if (!candidatesOk) {
      errorRate.add(1);
      console.error(`❌ Error querying candidates: status=${candidatesRes.status}`);
      if (candidatesRes.body) {
        console.error(`   Response: ${candidatesRes.body.substring(0, 200)}`);
      }
      return;
    }

    try {
      electionsWithCandidates = JSON.parse(candidatesRes.body);
    } catch (e) {
      errorRate.add(1);
      console.error(`❌ Error parsing candidates: ${e}`);
      return;
    }
  });

  if (electionsWithCandidates.length === 0) {
    console.warn('⚠️ No active elections available');
    return;
  }

  const availableElections = electionsWithCandidates.filter(e => e.canVote === true);

  if (availableElections.length === 0) {
    console.log(`ℹ️ User ${voter.id} already voted in all active elections`);
    return;
  }

  const selectedElection = availableElections[Math.floor(Math.random() * availableElections.length)];

  if (!selectedElection.candidates || selectedElection.candidates.length === 0) {
    console.warn(`⚠️ No candidates for election ${selectedElection.electionId}`);
    return;
  }

  const selectedCandidate = selectedElection.candidates[Math.floor(Math.random() * selectedElection.candidates.length)];

  sleep(1 + Math.random() * 2);
  //#endregion

  //#region Cast Vote
  group('3. Cast vote', function () {
    const votePayload = JSON.stringify({
      electionId: selectedElection.electionId,
      candidateId: selectedCandidate.candidateId
    });

    const startVote = Date.now();
    const voteRes = http.post(
      `${BASE_URL}/api/votes`,
      votePayload,
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${authToken}`
        },
        timeout: '15s',
        tags: { name: 'CastVote' },
        responseCallback: http.expectedStatuses(201, 409)
      }
    );
    const voteTime = Date.now() - startVote;
    voteCastDuration.add(voteTime);

    check(voteRes, {
      'vote: status 201 or 409': (r) => r.status === 201 || r.status === 409,
      'vote: response < 3s': () => voteTime < 3000,
    });

    if (voteRes.status === 201) {
      voteSuccessRate.add(1);
      const voteSuccess = check(voteRes, {
        'vote: confirmation received': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.message && body.electionId && body.candidateId;
          } catch {
            return false;
          }
        }
      });
      if (!voteSuccess) {
        errorRate.add(1);
      }
    } else if (voteRes.status === 409) {
      voteSuccessRate.add(1);
      check(voteRes, {
        'vote: already voted message': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.message && body.message.includes('Ya has emitido');
          } catch {
            return false;
          }
        }
      });
    } else if (voteRes.status === 400 || voteRes.status === 404) {
      voteSuccessRate.add(0);
      errorRate.add(1);
      console.warn(`⚠️ Validation failed: status=${voteRes.status}, body=${voteRes.body}`);
    } else {
      errorRate.add(1);
      voteSuccessRate.add(0);
      console.error(`❌ Error casting vote: status=${voteRes.status}`);
      if (voteRes.body) {
        console.error(`   Response: ${voteRes.body.substring(0, 200)}`);
      }
    }
  });

  sleep(1);
  //#endregion
}
//#endregion

//#region Teardown
export function teardown(data) {
  console.log('='.repeat(60));
  console.log('✅ VOTE TEST COMPLETED');
  console.log('='.repeat(60));

  if (data.error) {
    console.error(`❌ Test finished with errors: ${data.error}`);
  } else {
    console.log('💡 Note: 409 errors (already voted) are expected');
    console.log('   as some users have already cast their votes.');
  }

  console.log('='.repeat(60));
  console.log('📈 Check results in k6-results/');
  console.log('='.repeat(60));
}
//#endregion