#!/usr/bin/env node
/**
 * Final Test Status Check
 */

console.log('🔍 Checking final test status...\n');

const { execSync } = require('child_process');

try {
  const result = execSync('npm test', { 
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 30000
  });
  
  console.log(result);
  
  // Extract numbers from output
  const passedMatch = result.match(/(\d+) passed/);
  const failedMatch = result.match(/(\d+) failed/);
  const totalMatch = result.match(/(\d+) total/);
  
  if (passedMatch && totalMatch) {
    const passed = parseInt(passedMatch[1]);
    const total = parseInt(totalMatch[1]);
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const successRate = ((passed / total) * 100).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${total}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (successRate === '100.00') {
      console.log('\n🎉 CONGRATULATIONS! 100% SUCCESS RATE ACHIEVED! 🎉');
    } else {
      console.log(`\n🔧 ${failed} test(s) still need fixes for 100% success`);
    }
    console.log('='.repeat(60));
  }

} catch (error) {
  console.log('Error output:', error.stdout?.toString() || error.message);
  
  const output = error.stdout?.toString() || '';
  
  // Try to extract info from error output
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const totalMatch = output.match(/(\d+) total/);
  
  if (passedMatch && totalMatch) {
    const passed = parseInt(passedMatch[1]);
    const total = parseInt(totalMatch[1]);
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const successRate = ((passed / total) * 100).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CURRENT TEST STATUS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${total}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log('='.repeat(60));
  }
}
