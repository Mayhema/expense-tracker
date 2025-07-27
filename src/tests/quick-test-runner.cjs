#!/usr/bin/env node
/**
 * Quick Test Runner - Check specific test status
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Running quick test check...\n');

const testCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const testProcess = spawn(testCommand, ['test'], {
  cwd: path.join(__dirname, '../..'),
  stdio: 'pipe'
});

let output = '';
let errorOutput = '';

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

testProcess.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  process.stderr.write(text);
});

testProcess.on('close', (code) => {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  
  // Extract test results
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const totalMatch = output.match(/(\d+) total/);
  
  if (passedMatch && totalMatch) {
    const passed = parseInt(passedMatch[1]);
    const total = parseInt(totalMatch[1]);
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const successRate = ((passed / total) * 100).toFixed(2);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${total}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (successRate === '100.00') {
      console.log('🎉 PERFECT! 100% SUCCESS RATE ACHIEVED!');
    } else {
      console.log(`🔧 Need to fix ${failed} more test(s) for 100% success`);
    }
  } else {
    console.log('⚠️  Could not parse test results');
  }
  
  console.log('='.repeat(50));
  
  process.exit(code);
});
