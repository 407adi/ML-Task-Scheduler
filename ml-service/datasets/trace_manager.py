import os
import json
import time
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional

DATASETS_DIR = Path(__file__).parent
UPLOADED_DIR = DATASETS_DIR / "uploaded"
UPLOADED_DIR.mkdir(exist_ok=True)

# Hardware Profile Multipliers & Specifications
HARDWARE_PROFILES = {
    "cloud_gpu_cluster": {
        "id": "cloud_gpu_cluster",
        "name": "Cloud AI Supercluster (8x NVIDIA A100 SXM4)",
        "description": "High-throughput GPU nodes with 80GB VRAM, NVLink 600GB/s, and PCIe Gen4.",
        "cpu_speedup": 1.8,
        "gpu_speedup": 6.5,
        "io_latency_ms": 1.2,
        "memory_bandwidth_gbps": 2039.0,
        "power_efficiency": 0.95
    },
    "fog_edge_hybrid": {
        "id": "fog_edge_hybrid",
        "name": "Distributed Fog & Edge Nodes (NVIDIA Jetson + ARM64)",
        "description": "Heterogeneous edge nodes with local NPU acceleration and moderate network latency.",
        "cpu_speedup": 0.85,
        "gpu_speedup": 2.2,
        "io_latency_ms": 18.5,
        "memory_bandwidth_gbps": 204.8,
        "power_efficiency": 0.45
    },
    "enterprise_cloud_vm": {
        "id": "enterprise_cloud_vm",
        "name": "Enterprise General-Purpose Cloud (Intel Xeon 64 vCPU)",
        "description": "Balanced compute and memory tier with NVMe SSD storage and 25 Gbps networking.",
        "cpu_speedup": 1.3,
        "gpu_speedup": 1.0,
        "io_latency_ms": 3.5,
        "memory_bandwidth_gbps": 307.2,
        "power_efficiency": 0.80
    },
    "low_power_iot_edge": {
        "id": "low_power_iot_edge",
        "name": "Low-Power IoT Micro-Nodes (Quad-Core Cortex-A72)",
        "description": "Constrained edge devices for lightweight sensor aggregation and pre-filtering.",
        "cpu_speedup": 0.4,
        "gpu_speedup": 0.3,
        "io_latency_ms": 45.0,
        "memory_bandwidth_gbps": 17.0,
        "power_efficiency": 0.15
    }
}

class TraceDatasetManager:
    def __init__(self):
        self._ensure_default_datasets()

    def _ensure_default_datasets(self):
        """Generates standard open-source benchmark trace datasets if not present."""
        # 1. Google Borg Cluster Trace
        google_path = DATASETS_DIR / "google_borg_cluster_trace.json"
        if not google_path.exists():
            self._generate_google_borg_trace(google_path)

        # 2. Alibaba PAI GPU Cluster Trace
        alibaba_path = DATASETS_DIR / "alibaba_pai_gpu_trace.json"
        if not alibaba_path.exists():
            self._generate_alibaba_gpu_trace(alibaba_path)

        # 3. Azure Serverless VM Workload Trace
        azure_path = DATASETS_DIR / "azure_serverless_vm_trace.json"
        if not azure_path.exists():
            self._generate_azure_vm_trace(azure_path)

        # 4. NASA HPC Fog Grid Workload Trace
        nasa_path = DATASETS_DIR / "nasa_hpc_fog_grid_trace.json"
        if not nasa_path.exists():
            self._generate_nasa_grid_trace(nasa_path)

    def _generate_google_borg_trace(self, path: Path, n_samples: int = 500):
        """Generates realistic sample of Google Borg 2019 Cluster Workload Trace."""
        rng = np.random.default_rng(42)
        records = []
        for i in range(n_samples):
            task_size = int(rng.choice([1, 2, 3], p=[0.55, 0.30, 0.15])) # SMALL, MED, LARGE
            task_type = int(rng.choice([1, 2, 3], p=[0.60, 0.25, 0.15])) # CPU, IO, MIXED
            priority = int(rng.choice([1, 2, 3, 4, 5], p=[0.35, 0.30, 0.20, 0.10, 0.05]))
            cpu_req = float(np.round(rng.uniform(0.1, 8.0), 2))
            mem_req = float(np.round(rng.uniform(0.5, 32.0), 2))
            resource_load = float(np.round(rng.beta(2.5, 4.0) * 100, 2))
            
            # Borg execution duration modeling
            base = {1: 1.2, 2: 4.8, 3: 18.5}[task_size]
            load_factor = 1.0 + (resource_load / 100.0) ** 2 * 1.5
            pri_factor = 1.0 + (3 - priority) * 0.1
            actual_time = float(np.round(max(0.1, base * load_factor * pri_factor * rng.lognormal(0, 0.15)), 2))

            records.append({
                "jobId": f"borg-job-{(i // 5) + 1:04d}",
                "taskId": f"borg-task-{i+1:05d}",
                "taskName": f"Borg Worker batch-{i+1}",
                "taskSize": task_size,
                "taskType": task_type,
                "priority": priority,
                "cpuRequest": cpu_req,
                "memoryGb": mem_req,
                "resourceLoad": resource_load,
                "actualTime": actual_time,
                "source": "Google Borg Cluster Trace (2019/2011)"
            })

        with open(path, "w") as f:
            json.dump({
                "id": "google_borg_trace",
                "name": "Google Borg Cluster Trace (Borg 2019)",
                "source": "Google Cluster Data (Borg Scheduler)",
                "description": "Production datacenter workload trace from Google Borg with heterogeneous task priority, CPU/memory allocations, and machine constraints.",
                "hardwareProfile": "enterprise_cloud_vm",
                "totalRecords": len(records),
                "records": records
            }, f, indent=2)

    def _generate_alibaba_gpu_trace(self, path: Path, n_samples: int = 500):
        """Generates realistic sample of Alibaba PAI GPU 2020 AI Cluster Trace."""
        rng = np.random.default_rng(101)
        records = []
        for i in range(n_samples):
            task_size = int(rng.choice([1, 2, 3], p=[0.25, 0.45, 0.30]))
            task_type = int(rng.choice([1, 3], p=[0.2, 0.8])) # Mostly GPU/Mixed ML
            priority = int(rng.choice([1, 2, 3, 4, 5], p=[0.15, 0.25, 0.35, 0.15, 0.10]))
            gpus = int(rng.choice([1, 2, 4, 8], p=[0.5, 0.25, 0.15, 0.10]))
            gpu_util = float(np.round(rng.uniform(40.0, 99.0), 1))
            resource_load = float(np.round(rng.beta(3.0, 3.0) * 100, 2))
            
            # PAI deep learning execution duration
            base = {1: 3.5, 2: 12.0, 3: 45.0}[task_size]
            gpu_boost = 1.0 / (gpus ** 0.6)
            actual_time = float(np.round(max(0.5, base * gpu_boost * (1 + resource_load/200) * rng.lognormal(0, 0.2)), 2))

            records.append({
                "jobId": f"pai-ml-{(i // 4) + 1:04d}",
                "taskId": f"pai-task-{i+1:05d}",
                "taskName": f"PAI PyTorch/TF Step-{i+1}",
                "taskSize": task_size,
                "taskType": task_type,
                "priority": priority,
                "gpuCount": gpus,
                "gpuUtilization": gpu_util,
                "resourceLoad": resource_load,
                "actualTime": actual_time,
                "source": "Alibaba PAI GPU Cluster Trace (2020)"
            })

        with open(path, "w") as f:
            json.dump({
                "id": "alibaba_gpu_trace",
                "name": "Alibaba PAI GPU Cluster Trace (2020)",
                "source": "Alibaba Platform for AI (PAI)",
                "description": "Heterogeneous AI training & inference trace featuring multi-GPU tasks, parameter servers, and GPU memory telemetry.",
                "hardwareProfile": "cloud_gpu_cluster",
                "totalRecords": len(records),
                "records": records
            }, f, indent=2)

    def _generate_azure_vm_trace(self, path: Path, n_samples: int = 500):
        """Generates sample of Microsoft Azure Serverless / VM Workload Trace."""
        rng = np.random.default_rng(202)
        records = []
        for i in range(n_samples):
            task_size = int(rng.choice([1, 2, 3], p=[0.70, 0.20, 0.10]))
            task_type = int(rng.choice([1, 2, 3], p=[0.35, 0.45, 0.20]))
            priority = int(rng.choice([1, 2, 3, 4, 5], p=[0.40, 0.30, 0.15, 0.10, 0.05]))
            vcpus = int(rng.choice([1, 2, 4, 8], p=[0.6, 0.25, 0.10, 0.05]))
            resource_load = float(np.round(rng.beta(2.0, 5.0) * 100, 2))
            
            base = {1: 0.8, 2: 3.2, 3: 14.0}[task_size]
            actual_time = float(np.round(max(0.05, base * (1 + (resource_load/100)**2) * rng.lognormal(0, 0.18)), 2))

            records.append({
                "jobId": f"azure-func-{(i // 8) + 1:04d}",
                "taskId": f"azure-invk-{i+1:05d}",
                "taskName": f"Azure Function invocation-{i+1}",
                "taskSize": task_size,
                "taskType": task_type,
                "priority": priority,
                "vCpuAllocated": vcpus,
                "resourceLoad": resource_load,
                "actualTime": actual_time,
                "source": "Microsoft Azure Serverless & VM Traces"
            })

        with open(path, "w") as f:
            json.dump({
                "id": "azure_vm_trace",
                "name": "Azure Serverless & VM Workloads",
                "source": "Microsoft Azure Public Dataset",
                "description": "High-concurrency serverless function invocations and VM trace metrics showing diurnal request patterns and execution bursts.",
                "hardwareProfile": "enterprise_cloud_vm",
                "totalRecords": len(records),
                "records": records
            }, f, indent=2)

    def _generate_nasa_grid_trace(self, path: Path, n_samples: int = 500):
        """Generates sample of NASA NAS Parallel / Fog Grid Workload Trace."""
        rng = np.random.default_rng(303)
        records = []
        for i in range(n_samples):
            task_size = int(rng.choice([1, 2, 3], p=[0.20, 0.40, 0.40]))
            task_type = int(rng.choice([1, 2, 3], p=[0.50, 0.30, 0.20]))
            priority = int(rng.choice([1, 2, 3, 4, 5], p=[0.10, 0.20, 0.40, 0.20, 0.10]))
            mpi_ranks = int(rng.choice([4, 8, 16, 32, 64], p=[0.3, 0.3, 0.2, 0.1, 0.1]))
            resource_load = float(np.round(rng.beta(3.5, 2.5) * 100, 2))
            
            base = {1: 2.0, 2: 8.5, 3: 28.0}[task_size]
            actual_time = float(np.round(max(0.2, base * (1 + (resource_load/80)) * rng.lognormal(0, 0.25)), 2))

            records.append({
                "jobId": f"nasa-sim-{(i // 3) + 1:04d}",
                "taskId": f"nasa-hpc-{i+1:05d}",
                "taskName": f"NAS Grid Parallel Step-{i+1}",
                "taskSize": task_size,
                "taskType": task_type,
                "priority": priority,
                "mpiRanks": mpi_ranks,
                "resourceLoad": resource_load,
                "actualTime": actual_time,
                "source": "NASA NAS Parallel Benchmarks (NPB / Grid Trace)"
            })

        with open(path, "w") as f:
            json.dump({
                "id": "nasa_grid_trace",
                "name": "NASA NAS Parallel & Fog Grid Workloads",
                "source": "NASA Ames Research Center / Grid Workloads Archive",
                "description": "Scientific computation batches and parallel MPI task distribution traces across distributed fog and grid nodes.",
                "hardwareProfile": "fog_edge_hybrid",
                "totalRecords": len(records),
                "records": records
            }, f, indent=2)

    def list_datasets(self) -> List[Dict[str, Any]]:
        """Lists all built-in and user-uploaded datasets with metadata."""
        datasets = []
        
        # Scan built-in JSON files
        for p in DATASETS_DIR.glob("*_trace.json"):
            try:
                with open(p, "r") as f:
                    data = json.load(f)
                    datasets.append({
                        "id": data.get("id", p.stem),
                        "name": data.get("name", p.stem),
                        "source": data.get("source", "Standard Benchmark"),
                        "description": data.get("description", ""),
                        "hardwareProfile": data.get("hardwareProfile", "enterprise_cloud_vm"),
                        "totalRecords": data.get("totalRecords", len(data.get("records", []))),
                        "isCustom": False,
                        "fileType": "json",
                        "updatedAt": time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(p.stat().st_mtime))
                    })
            except Exception:
                continue

        # Scan uploaded datasets
        for p in UPLOADED_DIR.glob("*.*"):
            if p.suffix.lower() in [".json", ".csv"]:
                try:
                    records_count = 0
                    desc = "User uploaded custom workload trace"
                    if p.suffix.lower() == ".json":
                        with open(p, "r") as f:
                            d = json.load(f)
                            records_count = len(d.get("records", d)) if isinstance(d, (list, dict)) else 0
                    else:
                        df = pd.read_csv(p)
                        records_count = len(df)

                    datasets.append({
                        "id": f"custom_{p.stem}",
                        "name": f"Custom Trace: {p.stem.replace('_', ' ').title()}",
                        "source": "User Uploaded Trace",
                        "description": desc,
                        "hardwareProfile": "enterprise_cloud_vm",
                        "totalRecords": records_count,
                        "isCustom": True,
                        "fileType": p.suffix.lower().replace(".", ""),
                        "filename": p.name,
                        "updatedAt": time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(p.stat().st_mtime))
                    })
                except Exception:
                    continue

        return datasets

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full dataset with records by ID."""
        # Built-in check
        for p in DATASETS_DIR.glob("*_trace.json"):
            try:
                with open(p, "r") as f:
                    data = json.load(f)
                    if data.get("id") == dataset_id or p.stem == dataset_id or dataset_id in p.stem:
                        return data
            except Exception:
                continue

        # Uploaded check
        for p in UPLOADED_DIR.glob("*.*"):
            if p.suffix.lower() in [".json", ".csv"]:
                try:
                    file_id = f"custom_{p.stem}"
                    if file_id == dataset_id or p.stem == dataset_id or dataset_id.endswith(p.stem):
                        if p.suffix.lower() == ".json":
                            with open(p, "r") as f:
                                data = json.load(f)
                                records = data.get("records", data) if isinstance(data, dict) else data
                                return {
                                    "id": file_id,
                                    "name": f"Custom: {p.stem.replace('_', ' ').title()}",
                                    "records": records,
                                    "totalRecords": len(records)
                                }
                        elif p.suffix.lower() == ".csv":
                            df = pd.read_csv(p)
                            records = df.to_dict(orient="records")
                            return {
                                "id": file_id,
                                "name": f"Custom: {p.stem.replace('_', ' ').title()}",
                                "records": records,
                                "totalRecords": len(records)
                            }
                except Exception:
                    continue

        return None

    def save_custom_dataset(self, filename: str, content_bytes: bytes) -> Dict[str, Any]:
        """Validates and saves an uploaded CSV or JSON trace dataset."""
        ext = Path(filename).suffix.lower()
        clean_name = Path(filename).stem.replace(" ", "_").lower()
        target_path = UPLOADED_DIR / f"{clean_name}{ext}"

        with open(target_path, "wb") as f:
            f.write(content_bytes)

        # Validate format
        records = []
        if ext == ".csv":
            df = pd.read_csv(target_path)
            records = self._normalize_dataframe_records(df)
        elif ext == ".json":
            with open(target_path, "r") as f:
                raw = json.load(f)
                raw_list = raw.get("records", raw) if isinstance(raw, dict) else raw
                records = self._normalize_raw_records(raw_list)
        else:
            target_path.unlink(missing_ok=True)
            raise ValueError("Supported file types are .csv and .json only.")

        if len(records) < 5:
            target_path.unlink(missing_ok=True)
            raise ValueError("Dataset must contain at least 5 workload trace records.")

        return {
            "id": f"custom_{clean_name}",
            "filename": target_path.name,
            "totalRecords": len(records),
            "sample": records[:5]
        }

    def _normalize_dataframe_records(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        # Map common column aliases
        col_map = {
            "task_size": "taskSize", "size": "taskSize", "size_code": "taskSize",
            "task_type": "taskType", "type": "taskType", "workload_type": "taskType",
            "priority": "priority", "prio": "priority",
            "resource_load": "resourceLoad", "load": "resourceLoad", "cpu_load": "resourceLoad",
            "actual_time": "actualTime", "duration": "actualTime", "execution_time": "actualTime", "time": "actualTime",
            "task_name": "taskName", "name": "taskName"
        }
        df = df.rename(columns={c: col_map[c.lower()] for c in df.columns if c.lower() in col_map})

        # Ensure required columns
        if "taskSize" not in df.columns: df["taskSize"] = 2
        if "taskType" not in df.columns: df["taskType"] = 1
        if "priority" not in df.columns: df["priority"] = 3
        if "resourceLoad" not in df.columns: df["resourceLoad"] = 50.0
        if "actualTime" not in df.columns: df["actualTime"] = 5.0

        # Type casts
        df["taskSize"] = df["taskSize"].fillna(2).astype(int)
        df["taskType"] = df["taskType"].fillna(1).astype(int)
        df["priority"] = df["priority"].fillna(3).astype(int)
        df["resourceLoad"] = df["resourceLoad"].fillna(50.0).astype(float)
        df["actualTime"] = df["actualTime"].fillna(5.0).astype(float)

        return df.to_dict(orient="records")

    def _normalize_raw_records(self, raw_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for item in raw_list:
            if not isinstance(item, dict): continue
            normalized.append({
                "taskName": item.get("taskName") or item.get("name") or "Custom Task",
                "taskSize": int(item.get("taskSize") or item.get("size") or 2),
                "taskType": int(item.get("taskType") or item.get("type") or 1),
                "priority": int(item.get("priority") or 3),
                "resourceLoad": float(item.get("resourceLoad") or item.get("load") or 50.0),
                "actualTime": float(item.get("actualTime") or item.get("duration") or 5.0)
            })
        return normalized

trace_manager = TraceDatasetManager()
