"""
preprocessing.py
-----------------
Cleans raw text (job descriptions, user profile text) before it is
converted into TF-IDF vectors.

Why preprocessing matters:
TF-IDF treats "Python" and "python" as two DIFFERENT words unless we
lowercase everything first. Similarly, punctuation like commas and
periods add noise that doesn't help measure topical similarity.
Removing common "stop words" (the, is, a, an, with...) stops them
from diluting the importance of meaningful words like "backend" or
"SQL".
"""

import re

# A small, hand-picked stopword list (kept simple & dependency-free,
# instead of pulling in nltk just for this).
STOP_WORDS = set("""
a an the and or but if while is are was were be been being
of to in on for with at by from as into like through after over
between out against during without before under around among
we you they he she it this that these those i our your their
we're we've i'm you're they're it's than then so such not no nor
""".split())


def clean_text(text: str) -> str:
    """
    Full preprocessing pipeline:
    1. Lowercase
    2. Remove punctuation / special characters (keep only letters, numbers, spaces)
    3. Tokenize (split into words)
    4. Remove stop words
    5. Join back into a single cleaned string

    Example:
        Input:  "We are looking for a Python Backend Developer with SQL experience."
        Output: "looking python backend developer sql experience"
    """
    if not text:
        return ""

    # Step 1: lowercase
    text = text.lower()

    # Step 2: remove anything that isn't a letter, digit, or space
    text = re.sub(r"[^a-z0-9\s\+\#]", " ", text)  # keep + and # for "c++", "c#"
    text = re.sub(r"\s+", " ", text).strip()

    # Step 3: tokenization (simple whitespace split)
    tokens = text.split(" ")

    # Step 4: remove stop words and very short tokens (noise)
    cleaned_tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]

    # Step 5: rejoin
    return " ".join(cleaned_tokens)


def build_user_profile_text(user: dict) -> str:
    """
    Combines a user's structured profile fields into ONE text blob
    that represents "what this user is about", ready for TF-IDF.

    We repeat skills once extra -- this is a simple, explainable way
    to give skills slightly more weight than free-text bio, without
    needing a complicated weighted-TF-IDF setup.
    """
    parts = [
        " ".join(user.get("skills", [])),
        " ".join(user.get("skills", [])),  # repeated -> extra weight
        user.get("preferredRole", ""),
        user.get("education", ""),
        user.get("bio", ""),
    ]
    raw_text = " ".join(parts)
    return clean_text(raw_text)


def build_job_text(job: dict) -> str:
    """
    Combines a job's title, description, category and required
    skills into one text blob, ready for TF-IDF.
    """
    parts = [
        job.get("title", ""),
        job.get("title", ""),  # repeated -> title words matter more
        " ".join(job.get("skills", [])),
        job.get("category", ""),
        job.get("description", ""),
    ]
    raw_text = " ".join(parts)
    return clean_text(raw_text)
