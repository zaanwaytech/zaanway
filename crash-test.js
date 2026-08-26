import http from 'k6/http';
import { check } from 'k6';

export const options = {
  // This will spike hard and crash it
  stages: [
    { duration: '30s', target: 20 },   // warm up
    { duration: '1m', target: 200 },   // SPIKE - this will hit Vercel 100 concurrent limit
    { duration: '2m', target: 300 },   // KEEP PUSHING - will burn Firebase quota
    { duration: '30s', target: 0 },    // stop
  ],
  thresholds: {
    http_req_failed: ['rate<1.0'], // we EXPECT failures
  },
};

export default function () {
  // Change this to the API that hits Firebase
  const res = http.get('https://harikrishnakj.in/'); 
  
  check(res, {
    'crashed with 429': (r) => r.status === 429,
    'crashed with 500': (r) => r.status >= 500,
    'firebase quota error': (r) => r.body.includes('RESOURCE_EXHAUSTED'),
  });
}