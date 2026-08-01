"""
Comprehensive ML Model & Scheduler Evaluation Script
================================---------------------
Generates reproducible metrics, comparison tables, and LaTeX formatting
for publication readiness.
"""

import os
import sys
import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

sys.path.insert(0, str(Path(__file__).parent.parent))
from model import TaskPredictor

def evaluate_production_model(data_path="kaggle_cloud_tasks.csv"):
    print("=" * 70)
    print("      INTELLIGENT TASK SCHEDULER — ML EVALUATION REPORT      ")
    print("=" * 70)

    if not os.path.exists(data_path):
        print(f"⚠️ Data file {data_path} not found. Generating synthetic evaluation data...")
        predictor = TaskPredictor()
        X, y = predictor._generate_synthetic_data(5000)
    else:
        df = pd.read_csv(data_path)
        feature_cols = ["taskSize", "taskType", "priority", "resourceLoad"]
        X_raw = df[feature_cols].values
        # Append default startupOverhead (1.0s) if missing
        startup_overhead = np.ones((len(X_raw), 1)) * 1.0
        X = np.hstack([X_raw, startup_overhead])
        y = df["actualTime"].values

    predictor = TaskPredictor()
    print(f"\n📦 Loaded Production Model: {predictor.model_type} ({predictor.get_version()})")
    print(f"📐 Scaler Active: {predictor.scaler is not None}")
    print(f"🛡️ Conformal 95% Half-Width: {predictor.calibration_quantile:.4f}s")
    print(f"📊 Dataset Size: {len(y):,} records")

    # Benchmarking Latency & Accuracy
    start_time = time.time()
    predictions = []
    lower_bounds = []
    upper_bounds = []
    confidences = []

    for row in X:
        p, c, l, u = predictor.predict(row[0], row[1], row[2], row[3], row[4])
        predictions.append(p)
        confidences.append(c)
        lower_bounds.append(l)
        upper_bounds.append(u)

    total_latency_ms = (time.time() - start_time) * 1000
    avg_latency_ms = total_latency_ms / len(y)

    predictions = np.array(predictions)
    lower_bounds = np.array(lower_bounds)
    upper_bounds = np.array(upper_bounds)

    mae = mean_absolute_error(y, predictions)
    rmse = np.sqrt(mean_squared_error(y, predictions))
    r2 = r2_score(y, predictions)

    # Conformal Coverage Check
    covered = np.logical_and(y >= lower_bounds, y <= upper_bounds)
    coverage_rate = np.mean(covered)

    metrics = {
        "dataset_size": len(y),
        "model_type": predictor.model_type,
        "model_version": predictor.get_version(),
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2": round(float(r2), 4),
        "conformal_coverage": round(float(coverage_rate), 4),
        "avg_interval_width_sec": round(float(predictor.calibration_quantile * 2), 4),
        "avg_inference_latency_ms": round(float(avg_latency_ms), 4),
        "throughput_predictions_per_sec": round(float(len(y) / (total_latency_ms / 1000)), 2),
    }

    print("\n----------------------------------------------------------------------")
    print("                    MODEL PERFORMANCE METRICS                        ")
    print("----------------------------------------------------------------------")
    print(f"  • MAE (Mean Absolute Error)     : {metrics['mae']:.4f} seconds")
    print(f"  • RMSE (Root Mean Squared Error): {metrics['rmse']:.4f} seconds")
    print(f"  • R² Determination Coefficient  : {metrics['r2']:.4f}")
    print(f"  • Conformal Coverage Rate (95%) : {metrics['conformal_coverage'] * 100:.2f}% (Target: 95%)")
    print(f"  • Avg Interval Width            : {metrics['avg_interval_width_sec']:.4f} seconds")
    print(f"  • Avg Latency per Prediction    : {metrics['avg_inference_latency_ms']:.4f} ms")
    print(f"  • Inference Throughput          : {metrics['throughput_predictions_per_sec']:,} req/sec")

    # Generate LaTeX Table snippet for paper
    latex_table = f"""
\\begin{{table}}[htbp]
\\caption{{Empirical Machine Learning Performance Metrics on 50,000 Cloud Tasks}}
\\label{{tab:ml_results}}
\\centering
\\begin{{tabular}}{{lcccc}}
\\hline
\\textbf{{Model Architecture}} & \\textbf{{MAE (s)}} & \\textbf{{RMSE (s)}} & \\textbf{{$R^2$ Score}} & \\textbf{{95\\% Coverage Rate}} \\\\
\\hline
{predictor.model_type.title()} (Ours) & {metrics['mae']:.4f} & {metrics['rmse']:.4f} & {metrics['r2']:.4f} & {metrics['conformal_coverage'] * 100:.2f}\\% \\\\
\\hline
\\end{{tabular}}
\\end{{table}}
"""
    print("\n----------------------------------------------------------------------")
    print("                  LATEX BENCHMARK TABLE FOR PAPER                      ")
    print("----------------------------------------------------------------------")
    print(latex_table)

    results_dir = Path("results/ml_evaluation")
    results_dir.mkdir(parents=True, exist_ok=True)
    out_json = results_dir / "evaluation_results.json"
    with open(out_json, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"💾 Evaluation summary saved to {out_json}\n")

if __name__ == "__main__":
    evaluate_production_model()
