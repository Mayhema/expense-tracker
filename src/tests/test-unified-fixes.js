/**
 * Unified test to verify CSP and app loading fixes
 */

console.log('🧪 UNIFIED TEST: CSP and App Loading Fixes');
console.log('==========================================');

async function testFixes() {
  console.log('\n✅ Test 1: CSP Policy Validation');
  console.log('Checking if external scripts are allowed...');

  // Simulate CSP check
  const cspMetaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMetaTag) {
    const content = cspMetaTag.getAttribute('content');
    console.log('CSP Content:', content);

    const allowsExternalScripts = content.includes('https://cdn.jsdelivr.net') &&
      content.includes('https://cdnjs.cloudflare.com');
    console.log('✅ Allows external CDN scripts:', allowsExternalScripts);

    const hasInvalidDirective = content.includes('popup-open');
    console.log('✅ No invalid popup-open directive:', !hasInvalidDirective);
  }

  console.log('\n✅ Test 2: Script Loading Verification');
  console.log('Checking if Chart.js and XLSX are available...');

  // Wait a bit for scripts to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Chart.js available:', typeof window.Chart !== 'undefined');
  console.log('XLSX available:', typeof window.XLSX !== 'undefined');

  console.log('\n✅ Test 3: Main App Initialization');
  console.log('Checking if main.js loaded without errors...');

  // Check if AppState is available (exported from main.js)
  console.log('AppState available:', typeof window.AppState !== 'undefined');

  console.log('\n🎉 Tests completed - Check browser console for any remaining errors');
}

// Run tests when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testFixes);
} else {
  testFixes();
}
