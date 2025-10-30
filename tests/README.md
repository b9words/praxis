# Praxis Platform E2E Testing Suite

This directory contains comprehensive End-to-End (E2E) tests for the Praxis Platform, designed to systematically test all user flows and catch breaking changes.

## 🎯 Overview

The E2E testing suite implements a **test-fix cycle** approach:
1. Run comprehensive tests with 30+ user actions
2. Stop at first error to identify issues immediately
3. Fix root causes (not symptoms)
4. Re-run tests to verify fixes
5. Use Gemini 2.5 Pro to analyze gaps and enhance tests

## 📁 Structure

```
tests/
├── e2e/                          # E2E test files
│   ├── complete-user-journey.spec.ts  # Master 30+ action test
│   ├── auth-flow.spec.ts              # Authentication tests
│   ├── library-reading.spec.ts        # Library/curriculum tests
│   ├── simulation-complete.spec.ts    # Simulation tests
│   └── community-interaction.spec.ts  # Community/forum tests
├── helpers/                      # Test utilities
│   ├── auth-helper.ts           # Authentication utilities
│   └── db-helper.ts             # Database utilities
├── seed-data.sql                # Comprehensive test data
├── global-setup.ts              # Global test setup
├── global-teardown.ts           # Global test cleanup
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Environment Setup**:
   ```bash
   # Set up environment variables
   cp .env.example .env.local
   # Add your Google AI API key for Gemini analysis
   echo "GOOGLE_AI_API_KEY=your_key_here" >> .env.local
   ```

2. **Database Setup**:
   ```bash
   # Reset and seed test database
   npm run db:reset
   npm run db:seed:test
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

### Running Tests

#### Basic E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

#### Test-Fix Cycle
```bash
# Run complete test-fix cycle
tsx scripts/test-fix-cycle.ts

# Run with custom configuration
tsx scripts/test-fix-cycle.ts --max-iterations 5 --continue-on-error

# Run with auto-fix attempts
tsx scripts/test-fix-cycle.ts --auto-fix --verbose
```

#### Analysis and Reporting
```bash
# Generate Gemini analysis report
npm run test:analyze

# Run full test suite with analysis
npm run test:full
```

## 🧪 Test Coverage

### Master Test: Complete User Journey (30+ Actions)

The `complete-user-journey.spec.ts` test covers:

**Authentication & Onboarding (Actions 1-5)**
1. Navigate to homepage
2. Click signup, fill form, submit
3. Verify email confirmation (bypassed in test)
4. Complete onboarding residency selection
5. Land on dashboard with residency set

**Dashboard & Navigation (Actions 6-10)**
6. View dashboard with recommendation card
7. Check radar chart (empty state)
8. Click notification bell, verify empty state
9. Navigate to library from dashboard
10. Navigate back to dashboard

**Library & Article Reading (Actions 11-17)**
11. Browse curriculum domains
12. Open specific domain (Year 1)
13. Open specific module
14. Open and read complete lesson/article
15. Scroll through content, trigger progress tracking
16. Use Smart Study Assistant (AI chat)
17. Bookmark the article

**Case Simulation Completion (Actions 18-25)**
18. Navigate to simulations page
19. Click on specific case
20. Read case briefing
21. Start simulation
22. View case files (CSV financial data, memos)
23. Interact with simulation stages:
    - Make strategic option selection
    - Fill out written analysis
    - Chat with AI persona
    - Submit stage data
24. Complete all simulation stages
25. Submit final simulation

**Debrief & Community (Actions 26-30)**
26. View generated debrief with scores
27. Check updated radar chart on profile
28. Navigate to community forum
29. Create new forum thread
30. Post reply to thread

**Profile & Admin (Actions 31-40)**
31. Edit profile information
32. Toggle profile to public
33. View own public profile
34. Access admin panel (as admin)
35. View analytics dashboard
36. Check updated progress on dashboard
37. Check notification bell for new notifications
38. Test error handling and edge cases
39. Verify all features work end-to-end
40. Final verification of complete user journey

## 🔧 Configuration

### Playwright Configuration

The `playwright.config.ts` is configured for aggressive testing:

- **Short Timeouts**: 5s for actions, 10s for navigation
- **Single Worker**: Prevents database conflicts
- **Screenshots/Videos**: Captured on failures
- **Test Database**: Isolated test environment
- **Global Setup/Teardown**: Database management

### Test Data

The `seed-data.sql` provides comprehensive test data:

- **3 Test Users**: Member, Admin, Editor roles
- **Complete Curriculum**: Domains, modules, lessons
- **Published Articles**: With full content
- **Case Studies**: With briefing documents
- **Forum Data**: Channels, threads, posts
- **User Progress**: Completed articles and simulations
- **Notifications**: Various notification types

## 🤖 Gemini 2.5 Pro Integration

### Analysis Tool

The `analyze-test-results.ts` script uses Gemini 2.5 Pro to:

- **Gap Analysis**: Identify missing test scenarios
- **Performance Issues**: Detect slow operations
- **UX Problems**: Find usability issues
- **Technical Issues**: Identify API/DB/component errors
- **Recommendations**: Suggest improvements
- **Production Readiness**: Assess deployment readiness

### Usage

```bash
# Analyze test results
npm run test:analyze

# Analyze specific results file
tsx scripts/analyze-test-results.ts test-results/results.json output-report.md
```

## 🐛 Debugging

### Common Issues

1. **Database Connection Errors**:
   ```bash
   # Check database is running
   npm run db:studio
   
   # Reset database
   npm run db:reset
   npm run db:seed:test
   ```

2. **Test Timeouts**:
   - Check if application is running on port 3400
   - Verify database is accessible
   - Check for console errors in browser

3. **Authentication Issues**:
   - Verify test users exist in database
   - Check Supabase configuration
   - Ensure email verification is bypassed in test

### Debug Mode

```bash
# Run tests in debug mode
npm run test:e2e:debug

# Run specific test in debug mode
npx playwright test complete-user-journey.spec.ts --debug
```

## 📊 Reporting

### Test Reports

- **HTML Report**: `test-results/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`
- **Gemini Analysis**: `test-results/gemini-analysis-report.md`

### Viewing Reports

```bash
# Open HTML report
npm run test:e2e:report

# View latest Gemini analysis
open test-results/gemini-analysis-report.md
```

## 🔄 Continuous Integration

### GitHub Actions (Example)

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:reset
      - run: npm run db:seed:test
      - run: npm run test:e2e
      - run: npm run test:analyze
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 🎯 Best Practices

### Writing Tests

1. **Real User Simulation**: Test as a real user would interact
2. **No Test Mode Code**: Don't add test-specific code to production
3. **Comprehensive Coverage**: Test all user flows and edge cases
4. **Clear Assertions**: Use descriptive test descriptions
5. **Error Handling**: Test both success and failure scenarios

### Maintaining Tests

1. **Keep Tests Fast**: Use short timeouts to catch performance issues
2. **Isolate Tests**: Each test should be independent
3. **Update Regularly**: Keep tests in sync with application changes
4. **Monitor Flakiness**: Investigate and fix flaky tests immediately
5. **Document Changes**: Update test documentation when adding features

## 🚨 Troubleshooting

### Test Failures

1. **Check Console Logs**: Look for JavaScript errors
2. **Verify Database State**: Ensure test data is correct
3. **Check Network Requests**: Verify API calls are working
4. **Review Screenshots**: Check what the test saw when it failed
5. **Run in Debug Mode**: Step through the test manually

### Performance Issues

1. **Check Timeouts**: Increase if legitimate delays exist
2. **Optimize Queries**: Look for slow database operations
3. **Review Components**: Check for unnecessary re-renders
4. **Monitor Memory**: Look for memory leaks
5. **Profile Application**: Use browser dev tools

## 📈 Metrics

### Success Criteria

- ✅ **All 30+ actions execute successfully** without errors
- ✅ **Zero production code backdoors** (no test mode flags)
- ✅ **All features work as real user** would experience
- ✅ **Gemini 2.5 Pro confirms** comprehensive coverage
- ✅ **Test suite runs in < 5 minutes** with short timeouts
- ✅ **Database seed script** populates complete test environment
- ✅ **All gaps documented and fixed** from PRD comparison

### Monitoring

- Track test execution time
- Monitor failure rates
- Measure coverage improvements
- Track fix success rates
- Monitor production readiness score

## 🤝 Contributing

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `feature-name.spec.ts`
3. Include comprehensive test coverage
4. Add to main test suite if needed
5. Update documentation

### Fixing Tests

1. Identify root cause (not symptom)
2. Fix in production code when possible
3. Update test if behavior changed legitimately
4. Verify fix with re-run
5. Document the fix

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Praxis Platform Documentation](../README.md)
- [Test Data Schema](../prisma/schema.prisma)

---

**Remember**: The goal is to catch all breaking changes and ensure the platform works perfectly for real users. When in doubt, test it!
