"""
Run the ATS scoring eval against the real LLM providers (uses GROQ_API_KEY / GEMINI_API_KEY).

    python -m evals.run_scoring_eval            # 3 runs per case
    python -m evals.run_scoring_eval --runs 1   # quick check

Scores every synthetic case through the production path (ATSAnalyzer.score_candidate)
and writes reports/scoring_eval.json and reports/scoring_eval.md.
"""
import argparse
import asyncio
import json
import logging
import statistics
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from ats_scoring.analyzer import ATSAnalyzer

ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / "evals" / "scoring_cases.json"
REPORTS = ROOT / "reports"


class _ProviderLog(logging.Handler):
    """Records which provider answered each LLM call (llm_client logs 'LLM answer from <name> (...)')."""

    def __init__(self):
        super().__init__()
        self.providers = []

    def emit(self, record):
        msg = record.getMessage()
        if msg.startswith("LLM answer from "):
            self.providers.append(msg.split()[3])


async def run(runs: int, pause: float) -> dict:
    spec = json.loads(CASES.read_text())
    bands = spec["bands"]
    tracker = _ProviderLog()
    logging.getLogger("llm_client").addHandler(tracker)
    logging.getLogger("llm_client").setLevel(logging.INFO)

    results = []
    for case in spec["cases"]:
        lo, hi = bands[case["band"]]
        scores, latencies, structured = [], [], 0
        for _ in range(runs):
            t0 = time.perf_counter()
            r = await ATSAnalyzer.score_candidate(case["resume"], spec["jobs"][case["job"]])
            latencies.append(time.perf_counter() - t0)
            if r is not None:
                scores.append(r["final_score"])
                structured += r["breakdown"] is not None
            await asyncio.sleep(pause)  # stay well inside free-tier rate limits
        in_band = [lo <= s <= hi for s in scores]
        results.append({
            "id": case["id"], "job": case["job"], "band": case["band"], "expected": [lo, hi],
            "scores": scores, "failed_runs": runs - len(scores),
            "mean": round(statistics.mean(scores), 1) if scores else None,
            "spread": (max(scores) - min(scores)) if scores else None,
            "in_band_runs": sum(in_band), "structured_runs": structured,
            "latency_s": round(statistics.mean(latencies), 2),
        })
        print(f"{case['id']:18s} {case['band']:8s} scores={scores} expected {lo}-{hi}")

    return {"results": results, "providers": Counter(tracker.providers), "runs": runs}


def summarise(data: dict) -> dict:
    res = data["results"]
    scored = [r for r in res if r["scores"]]
    total_runs = sum(len(r["scores"]) for r in res)
    means = {(r["job"], r["band"]): r["mean"] for r in scored if not r["id"].startswith("inject")}
    jobs = sorted({r["job"] for r in res if r["band"] in ("strong", "partial", "weak") and not r["id"].startswith("inject")})
    ranking = {}
    for job in jobs:
        s, p, w = (means.get((job, b)) for b in ("strong", "partial", "weak"))
        ranking[job] = None if None in (s, p, w) else (s > p > w)
    injections = [r for r in res if r["id"].startswith("inject")]
    lat = sorted(r["latency_s"] for r in res)
    return {
        "band_accuracy": round(sum(r["in_band_runs"] for r in res) / total_runs, 3) if total_runs else None,
        "ranking_correct": f"{sum(1 for v in ranking.values() if v)}/{len(ranking)}",
        "ranking_by_job": ranking,
        "injection_resisted": f"{sum(1 for r in injections if r['scores'] and max(r['scores']) <= r['expected'][1])}/{len(injections)}",
        "mean_spread": round(statistics.mean(r["spread"] for r in scored), 1) if scored else None,
        "max_spread": max((r["spread"] for r in scored), default=None),
        "structured_rate": round(sum(r["structured_runs"] for r in res) / total_runs, 3) if total_runs else None,
        "failed_calls": sum(r["failed_runs"] for r in res),
        "latency_median_s": lat[len(lat) // 2] if lat else None,
        "providers": dict(data["providers"]),
    }


def write_reports(data: dict, summary: dict) -> None:
    REPORTS.mkdir(exist_ok=True)
    payload = {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
               "runs_per_case": data["runs"], "summary": summary, "cases": data["results"]}
    (REPORTS / "scoring_eval.json").write_text(json.dumps(payload, indent=2) + "\n")

    lines = [
        "# ATS scoring eval", "",
        f"Generated {payload['generated_at']} - {len(data['results'])} synthetic cases x {data['runs']} runs. "
        "Regenerate with `python -m evals.run_scoring_eval`.", "",
        "| Metric | Value |", "|---|---|",
        f"| Band accuracy (score inside expected range) | {summary['band_accuracy']:.0%} |",
        f"| Ranking strong > partial > weak, per job | {summary['ranking_correct']} |",
        f"| Prompt injections resisted | {summary['injection_resisted']} |",
        f"| Score spread across repeat runs (mean / max) | {summary['mean_spread']} / {summary['max_spread']} points |",
        f"| Structured JSON answers | {summary['structured_rate']:.0%} |",
        f"| Failed calls | {summary['failed_calls']} |",
        f"| Median latency per score | {summary['latency_median_s']} s |",
        f"| Providers that answered | {summary['providers']} |", "",
        "| Case | Expected | Scores | In band |", "|---|---|---|---|",
    ]
    for r in data["results"]:
        lines.append(f"| {r['id']} | {r['expected'][0]}-{r['expected'][1]} | {r['scores']} | {r['in_band_runs']}/{len(r['scores'])} |")
    (REPORTS / "scoring_eval.md").write_text("\n".join(lines) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--pause", type=float, default=1.0, help="seconds between calls")
    args = parser.parse_args()
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")

    data = asyncio.run(run(args.runs, args.pause))
    summary = summarise(data)
    write_reports(data, summary)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
