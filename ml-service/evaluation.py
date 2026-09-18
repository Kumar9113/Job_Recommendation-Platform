"""
evaluation.py
--------------
Implements Precision@K and Recall@K for evaluating the
recommendation system, and a small experiment runner that compares
V1 (keyword matching) vs V2 (TF-IDF) vs V3 (TF-IDF + more fields).

WHY NOT ACCURACY?
Accuracy answers "what fraction of ALL predictions were correct?"
But a recommender doesn't classify every job as relevant/irrelevant
-- it RANKS a small list of jobs out of possibly hundreds. A model
that recommends 5 jobs and gets 3 right is doing something very
different from a classifier being "97% accurate" by mostly predicting
the majority class. Precision@K and Recall@K are built for ranked,
top-K style recommendation output.

PRECISION@K
    "Out of the K jobs I recommended, how many were actually relevant?"
    Precision@K = (# relevant jobs in top K) / K

RECALL@K
    "Out of ALL the relevant jobs that exist for this user, how many
     did I manage to surface in my top K?"
    Recall@K = (# relevant jobs in top K) / (total # relevant jobs)

EXAMPLE (from the project spec):
    Top-5 recommended jobs, 3 are relevant.
    Precision@5 = 3 / 5 = 0.6  (60% of what we showed was useful)
    If there were actually 6 relevant jobs in the whole dataset:
    Recall@5 = 3 / 6 = 0.5  (we only found half of the relevant jobs)
"""

from typing import List


def precision_at_k(recommended_ids: List[int], relevant_ids: List[int], k: int) -> float:
    top_k = recommended_ids[:k]
    if len(top_k) == 0:
        return 0.0
    relevant_set = set(relevant_ids)
    hits = sum(1 for job_id in top_k if job_id in relevant_set)
    return hits / k


def recall_at_k(recommended_ids: List[int], relevant_ids: List[int], k: int) -> float:
    if len(relevant_ids) == 0:
        return 0.0
    top_k = recommended_ids[:k]
    relevant_set = set(relevant_ids)
    hits = sum(1 for job_id in top_k if job_id in relevant_set)
    return hits / len(relevant_ids)


def evaluate_run(recommended_ids: List[int], relevant_ids: List[int], k: int = 5) -> dict:
    return {
        "precision_at_k": round(precision_at_k(recommended_ids, relevant_ids, k), 4),
        "recall_at_k": round(recall_at_k(recommended_ids, relevant_ids, k), 4),
        "k": k,
    }


def percentage_improvement(old_value: float, new_value: float) -> float:
    """
    (New - Old) / Old * 100
    Guards against division by zero (if the old baseline was 0).
    """
    if old_value == 0:
        return float('inf') if new_value > 0 else 0.0
    return round((new_value - old_value) / old_value * 100, 2)
