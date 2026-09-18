"""
recommender.py
---------------
The core recommendation engine.

HOW IT WORKS (high level):
    1. Take the user's profile text and every job's description text.
    2. Convert ALL of them into numbers using TF-IDF (each document
       becomes a vector; the vocabulary of all documents combined
       defines the "axes" of that vector space).
    3. Measure the cosine similarity between the user's vector and
       each job's vector -- a number between 0 (unrelated) and 1
       (identical topic).
    4. Sort jobs by similarity score, descending.
    5. Return the Top-K jobs, plus which of the user's skills
       actually appear in each job's required skills (for the
       "explainable recommendation" feature).

WHY TF-IDF + COSINE SIMILARITY (and not something fancier):
    - It's unsupervised: we don't need labeled training data
      ("this job was a good match for this user") to get started.
    - It's fully explainable: every number can be traced back to
      actual words in the text.
    - It's fast and cheap to compute, even with only a handful of
      job postings -- unlike deep learning models that need lots
      of data to be reliable.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from preprocessing import build_user_profile_text, build_job_text


def recommend_jobs(user: dict, jobs: list, top_k: int = 5) -> list:
    """
    Args:
        user: dict with keys like skills, education, experience,
              preferredRole, bio
        jobs: list of dicts, each with jobId, title, company,
              description, category, skills
        top_k: how many top recommendations to return

    Returns:
        List of dicts: [{ jobId, score, matchedSkills }, ...]
        sorted by score descending, length <= top_k
    """
    if not jobs:
        return []

    user_text = build_user_profile_text(user)
    job_texts = [build_job_text(job) for job in jobs]

    # The FIRST document in our corpus is the user's profile text,
    # followed by every job's text. Fitting TF-IDF on all of them
    # together ensures they share the same vocabulary/vector space,
    # which is required for cosine similarity to make sense.
    corpus = [user_text] + job_texts

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)  # shape: (1 + num_jobs, vocab_size)

    user_vector = tfidf_matrix[0:1]       # the user's row
    job_vectors = tfidf_matrix[1:]        # every job's row

    # cosine_similarity returns a (1, num_jobs) matrix; we flatten it
    # into a plain 1D array of similarity scores, one per job.
    similarities = cosine_similarity(user_vector, job_vectors).flatten()

    user_skills_lower = set(s.lower() for s in user.get("skills", []))

    results = []
    for job, score in zip(jobs, similarities):
        job_skills_lower = [s for s in job.get("skills", [])]
        matched = [s for s in job_skills_lower if s.lower() in user_skills_lower]

        results.append({
            "jobId": job["jobId"],
            "score": round(float(score), 4),
            "matchedSkills": matched,
        })

    # Sort by score descending, return top_k
    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]


def keyword_match_score(user: dict, job: dict) -> float:
    """
    VERSION 1 baseline (see experiments.py): naive keyword overlap,
    with NO TF-IDF weighting at all. Used only to compare against
    the TF-IDF version and prove it's actually an improvement.

    score = (number of user skills also required by the job)
            / (total number of skills required by the job)
    """
    user_skills = set(s.lower() for s in user.get("skills", []))
    job_skills = set(s.lower() for s in job.get("skills", []))

    if not job_skills:
        return 0.0

    overlap = user_skills.intersection(job_skills)
    return len(overlap) / len(job_skills)
