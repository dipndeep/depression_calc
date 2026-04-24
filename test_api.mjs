import http from 'http';

const testCases = [
  {
    label: 'HIGH risk profile',
    data: {
      age: 16, gender: 'Male', daily_social_media_hours: 6,
      platform_usage: 'TikTok', sleep_hours: 5, screen_time_before_sleep: 2,
      academic_performance: 2.5, physical_activity: 0.5,
      social_interaction_level: 'Low', stress_level: 8, anxiety_level: 9, addiction_level: 8
    }
  },
  {
    label: 'LOW risk profile',
    data: {
      age: 15, gender: 'Female', daily_social_media_hours: 1.5,
      platform_usage: 'Instagram', sleep_hours: 8.5, screen_time_before_sleep: 0.5,
      academic_performance: 3.8, physical_activity: 2,
      social_interaction_level: 'High', stress_level: 3, anxiety_level: 2, addiction_level: 2
    }
  }
];

async function testPredict(label, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const req = http.request(
      { hostname: 'localhost', port: 5000, path: '/api/predict', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }},
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          const result = JSON.parse(raw);
          console.log(`\n[${label}]`);
          console.log(`  prediction : ${result.prediction === 1 ? '🔴 HIGH RISK' : '🟢 LOW RISK'}`);
          console.log(`  probability: ${(result.probability * 100).toFixed(2)}%`);
          resolve(result);
        });
      }
    );
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('🧪 Testing Teen Depression API...');
  for (const tc of testCases) {
    await testPredict(tc.label, tc.data);
  }
  console.log('\n✅ All tests completed.\n');
}

run().catch(console.error);
