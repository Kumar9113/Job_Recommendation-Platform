"""
app.py
------
A tiny Flask web server that wraps recommender.py in an HTTP API.
This is the "ML microservice" that the Node.js backend calls.

Why is ML in a separate Python service instead of inside Node.js?
    - scikit-learn (TF-IDF, cosine similarity) is a Python library;
      Node.js has no mature equivalent.
    - Keeping ML code in Python lets us use the same
      industry-standard tools (pandas, numpy, sklearn) that are
      taught and used everywhere in data science.
    - It separates concerns: if the ML logic changes, we don't
      have to touch or redeploy the Node.js backend at all.

Endpoints:
    GET  /health        -> liveness check
    POST /recommend      -> { user, jobs, topK } -> { recommendations }
"""

from flask import Flask, request, jsonify
from recommender import recommend_jobs

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ml-service"})


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(force=True)

    user = data.get("user")
    jobs = data.get("jobs")
    top_k = data.get("topK", 5)

    if not user or jobs is None:
        return jsonify({"error": "Request body must include 'user' and 'jobs'."}), 400

    try:
        recommendations = recommend_jobs(user, jobs, top_k=top_k)
    except Exception as e:
        return jsonify({"error": f"Failed to compute recommendations: {str(e)}"}), 500

    return jsonify({"recommendations": recommendations})


if __name__ == "__main__":
    # NOTE: app.run() is Flask's built-in dev server -- fine for local
    # testing, but not for production (single-threaded, no concurrency
    # handling). In Docker, the Dockerfile launches this app via gunicorn
    # instead (see CMD), so this block only runs on `python app.py` directly.
    app.run(host="0.0.0.0", port=6100, debug=False)
