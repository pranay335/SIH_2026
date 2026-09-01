// Example test file
// This file demonstrates how to write unit tests

import { describe, it, expect } from 'vitest';

// Example function to test
const add = (a, b) => a + b;

const multiply = (a, b) => a * b;

// Test suite
describe('Math functions', () => {
  describe('add function', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add positive and negative numbers', () => {
      expect(add(5, -3)).toBe(2);
    });

    it('should add two negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });
  });

  describe('multiply function', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(2, 3)).toBe(6);
    });

    it('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0);
    });

    it('should multiply negative numbers', () => {
      expect(multiply(-2, 3)).toBe(-6);
    });
  });
});

// Example component test (if using React Testing Library)
describe('Example component tests', () => {
  it('should render without crashing', () => {
    // This would be a real test with render() from testing library
    expect(true).toBe(true);
  });
});