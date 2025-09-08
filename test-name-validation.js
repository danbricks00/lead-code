/**
 * Test script to verify name validation patterns
 */

// Current validation patterns from Chatbot.js
const firstNamePattern = /^[a-zA-Z'-\.]{2,}$/;
const lastNamePattern = /^[a-zA-Z\s'-\.]{2,}$/;

// Test cases
const testNames = [
  // First names
  { type: 'first', name: 'Avery-Betty', expected: true },
  { type: 'first', name: 'Mary-Jane', expected: true },
  { type: 'first', name: 'Jean-Luc', expected: true },
  { type: 'first', name: 'O\'Connor', expected: true },
  { type: 'first', name: 'P.J', expected: true },
  { type: 'first', name: 'John', expected: true },
  { type: 'first', name: 'A', expected: false }, // Too short
  { type: 'first', name: 'John123', expected: false }, // Numbers not allowed
  
  // Last names
  { type: 'last', name: 'Smith-Jones', expected: true },
  { type: 'last', name: 'O\'Connor-Smith', expected: true },
  { type: 'last', name: 'Van Der Berg', expected: true },
  { type: 'last', name: 'P.J. Smith', expected: true },
  { type: 'last', name: 'McDonald-Smith', expected: true },
  { type: 'last', name: 'Smith', expected: true },
  { type: 'last', name: 'A', expected: false }, // Too short
  { type: 'last', name: 'Smith123', expected: false }, // Numbers not allowed
];

console.log('🧪 Testing Name Validation Patterns\n');

let passed = 0;
let failed = 0;

testNames.forEach(test => {
  const pattern = test.type === 'first' ? firstNamePattern : lastNamePattern;
  const result = pattern.test(test.name);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} ${test.type.toUpperCase()}: "${test.name}" → ${result} (expected: ${test.expected})`);
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed! The chatbot already supports hyphenated names!');
} else {
  console.log('⚠️ Some tests failed. The validation may need updates.');
}
