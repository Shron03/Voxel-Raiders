# NETWORK DIAGNOSTICS & METRICS
**Project**: Voxel Raiders: Dimensional Rift  

---

## Target Network Thresholds

| Metric | Acceptable Threshold | Stress Threshold | Protocol Mitigation |
|---|---|---|---|
| **Round Trip Time (RTT)** | $\le 80$ ms | $\le 250$ ms | Client-side movement prediction & snapshot reconciliation |
| **Packet Jitter** | $\le 20$ ms | $\le 60$ ms | 100ms adaptive jitter interpolation buffer |
| **Packet Loss Rate** | $0\%$ | Up to $10\%$ loss tolerance | Sequence-numbered delta snapshots & reliable TCP/WebSocket transport |
| **Bandwidth (Per Client)**| $\le 30$ KB/sec | $\le 75$ KB/sec | Quantized delta compression, entity interest management |
| **Reconnection Grace** | 60.0 seconds | 90.0 seconds | Stateful session token persistence on server |

---

## Active Diagnostic Logs
*(Network stress tests and real-time packet round-trip logs will be appended here during Phase 7 testing).*
