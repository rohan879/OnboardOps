# Bootstrap Performance Timings - T4.7

**Target:** < 3 minutes per run on reference machine  
**Dev:** Dev 4 - Infra / Bob Shell  
**Phase:** 2

## Reference Machine Specifications

See [`demo-machine.md`](./demo-machine.md) for complete specifications.

## Timing Methodology

1. **Fresh Environment:** Each run starts from a clean state (no venv, no node_modules)
2. **Network Conditions:** Stable broadband connection (100+ Mbps)
3. **Measurement:** Wall-clock time from script start to completion
4. **Runs:** 5 sequential runs to establish baseline

## Baseline Timings (Pre-Optimization)

| Run | Total Time | Detect | Install | Migrate | Seed | HealthCheck | Notes |
|-----|-----------|--------|---------|---------|------|-------------|-------|
| 1   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | First run, cold cache |
| 2   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | Warm cache |
| 3   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | Warm cache |
| 4   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | Warm cache |
| 5   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | Warm cache |

**Average:** [TO BE FILLED]  
**Slowest Stage:** [TO BE FILLED]

## Optimization Applied

### Optimization 1: [TO BE FILLED]

**Target Stage:** [TO BE FILLED]  
**Technique:** [TO BE FILLED]  
**Expected Improvement:** [TO BE FILLED]

Example optimizations to consider:
- `pip install --no-cache-dir` to reduce disk I/O
- Parallel installation of independent dependencies
- Pre-built virtualenv tarball for common stacks
- Docker image pre-pull in background
- Lazy loading of non-critical dependencies

## Post-Optimization Timings

| Run | Total Time | Detect | Install | Migrate | Seed | HealthCheck | Improvement |
|-----|-----------|--------|---------|---------|------|-------------|-------------|
| 1   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] |
| 2   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] |
| 3   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] |
| 4   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] |
| 5   | [TO BE FILLED] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] | [TBF] |

**Average:** [TO BE FILLED]  
**Total Improvement:** [TO BE FILLED]  
**Target Met:** ✓ / ✗

## Idempotency Check

Second run on already-bootstrapped environment (should be < 5 seconds):

| Run | Time | Status |
|-----|------|--------|
| 1   | [TO BE FILLED] | [TBF] |
| 2   | [TO BE FILLED] | [TBF] |
| 3   | [TO BE FILLED] | [TBF] |

**Average:** [TO BE FILLED]  
**Target Met (< 5s):** ✓ / ✗

## Bottleneck Analysis

### Network I/O
- Package downloads: [TO BE FILLED]
- Docker image pulls: [TO BE FILLED]

### Disk I/O
- Virtualenv creation: [TO BE FILLED]
- Package extraction: [TO BE FILLED]

### CPU
- Package compilation: [TO BE FILLED]
- Dependency resolution: [TO BE FILLED]

## Recommendations for Phase 3

1. [TO BE FILLED]
2. [TO BE FILLED]
3. [TO BE FILLED]

## Testing Commands

```bash
# Fresh run timing
time ./scripts/bootstrap.sh

# Idempotency check
time ./scripts/bootstrap.sh  # Should be < 5s

# With auto-recovery
time ./scripts/auto_bootstrap.py --auto-recover

# With checkpoint
time ./scripts/bootstrap_with_checkpoint.sh

# With event relay
time ./scripts/bootstrap_relay.py
```

## Notes

- All timings measured on the reference demo machine
- Network conditions may vary; document any anomalies
- Idempotency is critical for developer experience
- Target of < 3 minutes is for first-time bootstrap
- Subsequent runs should be near-instant (< 5s)

---

**Last Updated:** [TO BE FILLED]  
**Measured By:** Dev 4  
**Demo Repository:** [TO BE FILLED]

## Phase 3 T4.10 - Stress Test Results

**Test Date:** [TO BE FILLED]  
**Script:** `scripts/stress-test-bootstrap.sh`  
**Acceptance Criteria:**
- All 10 runs succeed
- Mean time < 2 minutes
- Worst case < 3 minutes

### Test Scenarios

The stress test runs 10 sequential bootstrap operations with alternating failure modes:

1. **Run #1:** Clean environment
2. **Run #2:** Port blocked (port 3000 in use)
3. **Run #3:** No virtualenv
4. **Run #4:** No seed data
5. **Run #5:** Database not running
6. **Run #6:** Wrong Node version
7. **Run #7:** Clean environment
8. **Run #8:** Port blocked
9. **Run #9:** No virtualenv
10. **Run #10:** No seed data

### Results

| Run | Scenario | Status | Duration | Notes |
|-----|----------|--------|----------|-------|
| 1 | clean | [TBF] | [TBF] | [TBF] |
| 2 | port-blocked | [TBF] | [TBF] | [TBF] |
| 3 | no-venv | [TBF] | [TBF] | [TBF] |
| 4 | no-seed | [TBF] | [TBF] | [TBF] |
| 5 | no-db | [TBF] | [TBF] | [TBF] |
| 6 | wrong-node | [TBF] | [TBF] | [TBF] |
| 7 | clean | [TBF] | [TBF] | [TBF] |
| 8 | port-blocked | [TBF] | [TBF] | [TBF] |
| 9 | no-venv | [TBF] | [TBF] | [TBF] |
| 10 | no-seed | [TBF] | [TBF] | [TBF] |

**Summary:**
- Total Runs: 10
- Successful: [TBF]
- Failed: [TBF]
- Mean Time: [TBF]s
- Worst Case: [TBF]s
- Total Duration: [TBF]s

**Acceptance Status:** [PASS/FAIL]

### Running the Stress Test

```bash
# Run the full stress test
./scripts/stress-test-bootstrap.sh

# View results
cat /tmp/onboardops-stress-test-results.json | jq .

# View individual run logs
ls -la /tmp/onboardops-stress-test-logs/
```

### Stress Test Output

The stress test generates:
- **Results JSON:** `/tmp/onboardops-stress-test-results.json`
- **Individual Logs:** `/tmp/onboardops-stress-test-logs/run-N-scenario.log`

Example results JSON:
```json
{
  "test_name": "Bootstrap Stress Test",
  "phase": "Phase 3 T4.10",
  "timestamp": "2026-05-16T03:00:00Z",
  "total_runs": 10,
  "successful_runs": 10,
  "failed_runs": 0,
  "total_duration_seconds": 180,
  "mean_time_seconds": 18,
  "worst_time_seconds": 45,
  "results": [...]
}
```
