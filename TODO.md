# PIT Tax Bracket Update Plan

## Understanding
The backend (`backend/routes/calculator.js`) already has the correct PIT brackets matching the user's request. The frontend (`frontend/Calculator.html`) has **incorrect/outdated** brackets that need updating.

## Changes Completed ✅

### 1. frontend/Calculator.html - Updated `taxRates.pit.brackets` data object
✅ Changed brackets to match new rates:
  - 0 - 300,000 → 7%
  - 300,000 - 600,000 → 11%
  - 600,000 - 1,100,000 → 15%
  - 1,100,000 - 1,600,000 → 19%
  - 1,600,000 - 3,200,000 → 21%
  - 3,200,000+ → 24%

### 2. frontend/Calculator.html - Updated PIT Tax Brackets display table
✅ Updated the brackets reference table to show the correct new brackets and cumulative tax amounts.

### 3. frontend/Calculator.html - Fixed minor corruption from edits
✅ Cleaned up duplicate content and fixed `th` typo in resetVAT()

## Files NOT Modified
- `backend/routes/calculator.js` - Already had correct brackets

