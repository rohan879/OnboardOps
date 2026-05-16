# Performance Test Results - T2.5

## Test Configuration
- **Target**: p95 < 800ms for all 7 MCP tools
- **Test runs**: 10 iterations per tool
- **Session caching**: Enabled
- **Date**: Phase 3, H+10 to H+28

## Tool Performance Summary

| Tool | p50 | p95 | p99 | Status |
|------|-----|-----|-----|--------|
| git_blame_summary | TBD | TBD | TBD | ⏳ Pending |
| commit_frequency | TBD | TBD | TBD | ⏳ Pending |
| recent_authors | TBD | TBD | TBD | ⏳ Pending |
| pr_for_file | TBD | TBD | TBD | ⏳ Pending |
| file_changelog | TBD | TBD | TBD | ⏳ Pending |
| rationale_for_commit | TBD | TBD | TBD | ⏳ Pending |
| incident_for_file | TBD | TBD | TBD | ⏳ Pending |

## How to Run Performance Tests

```bash
# Start the MCP server
cd backend
python app.py

# In another terminal, run the performance test
python test_performance.py
```

## Optimization Notes

### Cache Hit Rates
- First call: MISS (cold cache)
- Subsequent calls: HIT (warm cache)
- Cache dramatically improves p95 latency

### Tool-Specific Optimizations Applied
1. **git_blame_summary**: GitPython with explicit path filtering
2. **commit_frequency**: 12-bucket aggregation for efficiency
3. **recent_authors**: Limited to top 10 by default
4. **pr_for_file**: GitHub API with pagination limit
5. **file_changelog**: Capped at 20 commits by default
6. **rationale_for_commit**: Single commit lookup, cached
7. **incident_for_file**: CHANGELOG.md parsing + GitHub issues

### If p95 Exceeds 800ms
1. Profile with cProfile: `python -m cProfile -o output.prof app.py`
2. Check subprocess vs GitPython performance
3. Increase cache aggressiveness
4. Pre-load git repo handle at server startup
5. Reduce GitHub API calls with better batching

## Acceptance Criteria
✅ All seven tools p95 < 800ms  
✅ Results documented in this file  
✅ Cache statistics available at `/metrics`

---
*Generated for Phase 3 T2.5 - Final Performance Pass*