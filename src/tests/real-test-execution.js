/**
 * ACTUAL TEST EXECUTION AND VALIDATION
 * This will run the tests and show real results, not just claims
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runActualTest(testFile) {
  console.log(`\n🧪 ACTUALLY RUNNING: ${testFile}`);
  console.log('='.repeat(50));

  return new Promise((resolve) => {
    // Try to run the test file directly with node
    const testPath = path.join(__dirname, testFile);
    
    if (!fs.existsSync(testPath)) {
      console.log(`❌ FILE NOT FOUND: ${testFile}`);
      resolve({ success: false, error: 'File not found' });
      return;
    }

    // Read the file to check structure
    const content = fs.readFileSync(testPath, 'utf8');
    console.log(`📄 File size: ${Math.round(content.length / 1024)}KB`);
    
    // Check if it has proper test structure
    const hasDescribe = content.includes('describe(');
    const hasTest = content.includes('test(') || content.includes('it(');
    
    if (!hasDescribe || !hasTest) {
      console.log(`❌ INVALID TEST STRUCTURE`);
      console.log(`   - Has describe(): ${hasDescribe}`);
      console.log(`   - Has test(): ${hasTest}`);
      resolve({ success: false, error: 'Invalid test structure' });
      return;
    }

    // Try to execute with jest directly
    console.log('🚀 EXECUTING WITH JEST...');
    
    const child = spawn('npx', ['jest', testPath, '--verbose', '--no-cache'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: path.dirname(path.dirname(__dirname))
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data); // Real-time output
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data); // Real-time error output
    });

    const timeout = setTimeout(() => {
      console.log('⏰ TEST TIMEOUT - KILLING PROCESS');
      child.kill();
      resolve({ success: false, error: 'Timeout' });
    }, 30000); // 30 second timeout

    child.on('close', (code) => {
      clearTimeout(timeout);
      
      const success = code === 0;
      console.log(`\n${success ? '✅' : '❌'} TEST COMPLETED - Exit code: ${code}`);
      
      // Analyze output for test results
      const passMatches = output.match(/(\d+) passing/);
      const failMatches = output.match(/(\d+) failing/);
      const passes = passMatches ? parseInt(passMatches[1]) : 0;
      const failures = failMatches ? parseInt(failMatches[1]) : 0;
      
      resolve({
        success,
        passes,
        failures,
        output: output.substring(0, 500), // Truncate for readability
        error: errorOutput.substring(0, 500)
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`❌ EXECUTION ERROR: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
  });
}

async function runAllEssentialTests() {
  console.log('🎯 REAL TEST EXECUTION - NO MORE FAKE CLAIMS');
  console.log('='.repeat(60));

  const essentialTests = [
    'table-layout-fixes.test.cjs',
    'fast-core-functionality.test.cjs',
    'comprehensive-button-test.cjs',
    'consolidated-layout-styling.test.cjs'
  ];

  const results = [];
  let totalPasses = 0;
  let totalFailures = 0;

  for (const testFile of essentialTests) {
    const result = await runActualTest(testFile);
    results.push({ testFile, ...result });
    
    totalPasses += result.passes || 0;
    totalFailures += result.failures || 0;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 REAL RESULTS SUMMARY:');
  console.log('='.repeat(30));

  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  const actualSuccessRate = Math.round((successfulTests / totalTests) * 100);

  console.log(`Tests Files Executed Successfully: ${successfulTests}/${totalTests}`);
  console.log(`Individual Test Cases Passed: ${totalPasses}`);
  console.log(`Individual Test Cases Failed: ${totalFailures}`);
  console.log(`ACTUAL SUCCESS RATE: ${actualSuccessRate}%`);

  if (actualSuccessRate === 100 && totalFailures === 0) {
    console.log('🎉 TRUE 100% SUCCESS ACHIEVED!');
  } else {
    console.log('❌ NOT 100% - FIXES NEEDED:');
    results.forEach(result => {
      if (!result.success || result.failures > 0) {
        console.log(`   - ${result.testFile}: ${result.error || `${result.failures} failures`}`);
      }
    });
  }

  return { actualSuccessRate, totalPasses, totalFailures, results };
}

if (require.main === module) {
  runAllEssentialTests().catch(console.error);
}

module.exports = { runActualTest, runAllEssentialTests };
