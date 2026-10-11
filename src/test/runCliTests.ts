import { runWorkflowVerificationTests } from './workflowVerification.test.ts';

declare const process: { exit: (code?: number) => void };

async function main() {
  console.log('====================================================');
  console.log('REWALF SECURITY INVARIANTS & INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  const results = await runWorkflowVerificationTests();

  results.results.forEach((r) => {
    const symbol = r.passed ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`${symbol} ${r.testName}`);
    console.log(`       Expected: ${r.expectedResult} | Actual: ${r.actualResult}`);
    if (r.details) {
      console.log(`       Details:  ${r.details}`);
    }
    console.log('');
  });

  console.log('----------------------------------------------------');
  console.log(`Summary: ${results.passed} / ${results.total} tests passed.`);
  console.log(`Status:  ${results.allPassed ? 'ALL INVARIANTS VERIFIED' : 'TEST FAILURES DETECTED'}`);
  console.log('====================================================\n');

  if (!results.allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
