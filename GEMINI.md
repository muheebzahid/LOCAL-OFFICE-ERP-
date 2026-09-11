# Mandatory System Safety & Crash Prevention Rule

## Strict Zero-Crash Policy
Before executing any prompt, code modification, feature addition, schema edit, or system change:

1. **Pre-Implementation Risk Analysis:** Evaluate every request and proposed code edit for potential runtime failures, client hydration exceptions, missing/null field crashes, undefined symbol reference errors, deadlocks, or server build timeouts.
2. **1% Crash Probability Threshold:** If there is even a 1% risk or probability that a proposed edit could crash the application or cause a runtime exception (e.g., client-side exception screen, server 500 error, OOM crash), **DO NOT IMPLEMENT IT**.
3. **Defensive Verification & Safety First:**
   - Always validate data schemas and enforce null-safe wrappers (safeStr, safeLower, safeArray, optional chaining) on all data properties.
   - Run local build checks (npm run build) and test execution before deploying any changes.
   - If a prompt requests a risky or ambiguous edit, pause and ensure 100% crash-free safety before taking action.
