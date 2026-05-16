# Bootstrap Idempotence Verification - T4.5

**Task Owner:** Dev 4 (Infra / Bob Shell)  
**Date:** 2026-05-16  
**Requirement:** Bootstrap must complete in <5s on already-configured environment with zero file mutations

---

## Overview

Idempotence is a critical property of the OnboardOps bootstrap system. When run on an already-healthy environment, the bootstrap should:

1. **Complete quickly** (<5 seconds)
2. **Make no changes** (zero file mutations)
3. **Exit successfully** (exit code 0)

This ensures that developers can safely re-run bootstrap without fear of breaking their working environment.

---

## Verification Method

### Test Script

The verification is performed by [`scripts/verify-idempotence.sh`](../scripts/verify-idempotence.sh), which:

1. **Captures baseline state:**
   - Git status (tracked file changes)
   - File checksums (MD5 hashes of all project files)

2. **Runs bootstrap 5 times:**
   - Measures execution time for each run
   - Checks for file mutations after each run
   - Records results in JSON format

3. **Verifies final state:**
   - Compares final git status to baseline
   - Compares final checksums to baseline
   - Reports any discrepancies

### Success Criteria

For idempotence to be verified, ALL of the following must be true:

- ✅ All 5 runs complete in <5 seconds
- ✅ No git status changes after any run
- ✅ No file checksum changes (excluding logs/timestamps)
- ✅ All runs exit with code 0

---

## Running the Verification

### Prerequisites

1. **Healthy environment:** Bootstrap must have been run successfully at least once
2. **Clean git state:** No uncommitted changes
3. **All services running:** Database, dev servers, etc.

### Execution

```bash
cd OnboardOps
./scripts/verify-idempotence.sh
```

### Expected Output

```
=== Bootstrap Idempotence Verification ===
Testing that bootstrap is idempotent on healthy environment

Step 1: Capture baseline state
✓ Baseline captured

Step 2: Run bootstrap 5 times
Run 1/5
  ✓ Completed in 2.341s (under 5s limit)
  ✓ No git status changes

Run 2/5
  ✓ Completed in 2.198s (under 5s limit)
  ✓ No git status changes

Run 3/5
  ✓ Completed in 2.267s (under 5s limit)
  ✓ No git status changes

Run 4/5
  ✓ Completed in 2.312s (under 5s limit)
  ✓ No git status changes

Run 5/5
  ✓ Completed in 2.289s (under 5s limit)
  ✓ No git status changes

Step 3: Verify final state
✓ Git status unchanged after all runs
✓ File checksums unchanged

=== Summary ===
Total runs: 5
Mean time: 2.281s
Min time: 2.198s
Max time: 2.341s
Time limit: 5s

✓ IDEMPOTENCE VERIFIED
Bootstrap is idempotent: completes quickly with no mutations
```

---

## Results Format

Results are saved to `/tmp/idempotence-results.json`:

```json
{
  "runs": [
    {
      "run": 1,
      "duration": 2.341,
      "passed": true,
      "under_time_limit": true,
      "no_mutations": true
    },
    {
      "run": 2,
      "duration": 2.198,
      "passed": true,
      "under_time_limit": true,
      "no_mutations": true
    }
  ],
  "summary": {
    "total_runs": 5,
    "mean_time": 2.281,
    "min_time": 2.198,
    "max_time": 2.341,
    "time_limit": 5,
    "all_passed": true
  }
}
```

---

## Implementation Details

### How Bootstrap Achieves Idempotence

The bootstrap script achieves idempotence through several mechanisms:

#### 1. Pre-flight Checks

Before performing any action, bootstrap checks if it's already done:

```bash
# Example: Check if dependencies are installed
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
    echo "Dependencies already installed, skipping..."
    return 0
fi
```

#### 2. Conditional Execution

Each stage only runs if necessary:

```bash
# Stage 1: Detect (always runs, but read-only)
detect_environment

# Stage 2: Install (only if missing)
if ! check_dependencies_installed; then
    install_dependencies
fi

# Stage 3: Migrate (only if pending migrations)
if has_pending_migrations; then
    run_migrations
fi

# Stage 4: Seed (only if database empty)
if is_database_empty; then
    seed_database
fi

# Stage 5: Health Check (always runs, but read-only)
run_health_check
```

#### 3. Idempotent Operations

All operations are designed to be safely repeatable:

- **File creation:** Check if file exists before creating
- **Directory creation:** Use `mkdir -p` (no error if exists)
- **Package installation:** Package managers skip already-installed packages
- **Database migrations:** Migration tools track applied migrations
- **Service startup:** Check if service is already running

#### 4. No Destructive Actions

Bootstrap never:
- Deletes files
- Overwrites existing configuration
- Drops databases
- Kills running processes (except for port conflicts in auto-recovery)

---

## Troubleshooting

### Issue: Bootstrap Takes >5 Seconds

**Possible Causes:**
- Network latency checking external services
- Slow health check endpoints
- Unnecessary file I/O operations

**Solutions:**
1. Profile bootstrap execution: `time ./scripts/bootstrap.sh`
2. Add caching for expensive checks
3. Parallelize independent operations
4. Skip health checks if services are already healthy

### Issue: File Mutations Detected

**Possible Causes:**
- Log files being written
- Timestamp updates in generated files
- Cache files being created
- Lock files being touched

**Solutions:**
1. Identify mutated files: `git status --porcelain`
2. Move logs to `/tmp` or `.gitignore`
3. Use deterministic timestamps in generated files
4. Exclude cache directories from mutation checks

### Issue: Inconsistent Timing

**Possible Causes:**
- System load variations
- Network conditions
- Background processes
- Cold vs warm cache

**Solutions:**
1. Run verification multiple times
2. Increase time limit if consistently close to 5s
3. Optimize slow operations
4. Consider median time instead of mean

---

## Manual Verification Steps

If you need to manually verify idempotence:

### 1. Capture Baseline

```bash
cd OnboardOps
git status --porcelain > /tmp/baseline-git.txt
find . -type f -not -path "./.git/*" -exec md5 {} \; > /tmp/baseline-checksums.txt
```

### 2. Run Bootstrap

```bash
time ./scripts/bootstrap.sh
```

### 3. Check for Changes

```bash
# Check git status
git status --porcelain > /tmp/after-git.txt
diff /tmp/baseline-git.txt /tmp/after-git.txt

# Check checksums
find . -type f -not -path "./.git/*" -exec md5 {} \; > /tmp/after-checksums.txt
diff /tmp/baseline-checksums.txt /tmp/after-checksums.txt
```

### 4. Verify Timing

The bootstrap should complete in <5 seconds. If using `time`:

```
real    0m2.341s
user    0m0.123s
sys     0m0.089s
```

The `real` time should be <5s.

---

## Integration with CI/CD

The idempotence verification can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Verify Bootstrap Idempotence
  run: |
    cd OnboardOps
    ./scripts/bootstrap.sh  # Initial setup
    ./scripts/verify-idempotence.sh  # Verify idempotence
```

This ensures that any changes to the bootstrap script maintain idempotence.

---

## Related Documentation

- [Bootstrap Script](../scripts/bootstrap.sh) - Main bootstrap implementation
- [Auto-Recovery Patterns](auto-recovery-patterns.md) - Recovery mechanisms
- [Bootstrap Timings](bootstrap-timings.md) - Performance benchmarks

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-16  
**Owner:** Dev 4 (Infra / Bob Shell)