# Canonical Experiment Configuration & Provenance

This document maps every numerical claim in the research paper to its exact source script,
command, and output file, enabling full reproducibility.

---

## Experiment 1: Scheduling Algorithm Statistical Convergence (EXP-01)

| Property | Value |
|----------|-------|
| **Script** | `run_all_experiments.py` → `run_exp01()` |
| **Command** | `python run_all_experiments.py` |
| **Output** | `results/master_experiments/exp01_statistical_convergence.csv` |
| **Seeds** | 30 independent random seeds per algorithm |
| **Task scales** | N ∈ {50, 100, 150, 200, 250, 300} |
| **Nodes** | M = 10 |
| **Algorithms** | FCFS, Round-Robin, Min-Min, IPSO, IACO, Hybrid Heuristic (HH) |
| **Metric** | **Total Scheduling Delay** (sum of per-task delays, NOT classical makespan) |
| **Statistical test** | Wilcoxon signed-rank (paired, vs HH reference) |
| **Key result (N=300)** | HH: 905.59 ± 84.09 s, IACO: 910.09 ± 82.64 s (p = 0.158, not significant) |

> **Note:** FCFS assigns tasks sequentially by arrival order; Round-Robin uses load-aware
> cyclic distribution considering accumulated node delay. These produce different results.

---

## Experiment 2: Conformal Prediction Coverage (EXP-02)

| Property | Value |
|----------|-------|
| **Script** | `run_all_experiments.py` → `run_exp02()` |
| **Command** | `python run_all_experiments.py` |
| **Output** | `results/master_experiments/exp02_conformal_coverage.csv` |
| **Model** | Random Forest Regressor (100 trees) |
| **Features** | `[taskSize, taskType, priority, resourceLoad, startupOverhead]` (5 features) |
| **Dataset** | Synthetic cloud-task dataset (generated inline, N=5000) |
| **Split** | 80% train / 20% calibration holdout (no leakage) |
| **Alpha values** | α ∈ {0.05, 0.10, 0.15, 0.20} |
| **Coverage guarantee** | Split conformal with finite-sample correction |

---

## Experiment 3: Throughput & Scalability Benchmark (EXP-03)

| Property | Value |
|----------|-------|
| **Script** | `run_all_experiments.py` → `run_exp03()` |
| **Command** | `python run_all_experiments.py` |
| **Output** | `results/master_experiments/exp03_throughput_scalability.csv` |
| **Batch sizes** | N ∈ {100, 250, 500, 1000, 2500, 5000} |
| **Scope** | **Scheduler computation only** — does NOT measure end-to-end API throughput |
| **Algorithm** | Min-Min for N ≤ 500; Round-Robin for N > 500 |
| **Repetitions** | 5 per batch size |

> **Important:** These are local Python computation benchmarks, not HTTP API load tests.
> Do not cite these numbers as "API throughput" or "end-to-end system throughput."

---

## Experiment 4: RL vs Metaheuristic Trade-off (EXP-04)

| Property | Value |
|----------|-------|
| **Script** | `run_all_experiments.py` → `run_exp04()` |
| **Command** | `python run_all_experiments.py` |
| **Output** | `results/master_experiments/exp04_rl_vs_metaheuristic.csv` |
| **Node scales** | M ∈ {5, 10, 20, 50} |
| **Tasks** | N = 100 |
| **RL proxy** | Score-based single-pass forward inference (not trained MaskablePPO) |

---

## ML Model Canonical Evaluation

| Property | Value |
|----------|-------|
| **Training script** | `ml-service/train.py` |
| **Command** | `python train.py --model random_forest --seed 42` |
| **Evaluation script** | `ml-service/scripts/evaluate_models.py` |
| **Output** | `results/ml_evaluation/evaluation_results.json` |
| **Features** | `[taskSize, taskType, priority, resourceLoad, startupOverhead]` |
| **Dataset** | As specified by training script (synthetic fallback or CSV) |
| **Split** | 85% dev / 15% test; dev further split 80% train / 20% calibration |
| **Calibration** | Split conformal on held-out calibration set (α = 0.05) |
| **Model artifact** | `ml-service/models/task_predictor.joblib` |
| **Metadata** | `ml-service/models/metadata/<version>.json` |

### Runtime vs Research Configuration

| Setting | Research (EXP-02) | Runtime (model.py) |
|---------|-------------------|-------------------|
| Alpha | 0.10 (90% target) | 0.05 (95% target) |
| Features | 5 | 5 (4 fallback) |
| Calibration | Split conformal | Split conformal |
| Dataset | Synthetic inline | PostgreSQL / synthetic |

---

## Reproducibility Commands

```bash
# Full experiment suite (generates all EXP-01 through EXP-04 CSVs)
python run_all_experiments.py

# Canonical ML model training
cd ml-service
python train.py --model random_forest --seed 42

# Canonical ML evaluation
python scripts/evaluate_models.py

# Verify results
cat ../results/master_experiments/exp01_statistical_convergence.csv
cat ../results/master_experiments/exp02_conformal_coverage.csv
cat ../results/ml_evaluation/evaluation_results.json
```
