"""
accuracy.py — Word-level accuracy and Word Error Rate (WER) calculation.

Computes:
1. Word Error Rate (WER) using dynamic programming Levenshtein distance on word tokens:
   WER = (Substitutions + Deletions + Insertions) / N_reference
2. Word Match Accuracy %:
   Accuracy = max(0.0, 1.0 - min(1.0, WER)) * 100%
3. Token-level alignment (matched, substituted, deleted, inserted) for UI rendering.

Supports Tamil script Unicode, Tanglish (code-mixed), and English tokens cleanly.
"""

import re
from typing import List, Dict, Any, Tuple


# Regex pattern to strip standard punctuation while keeping Tamil Unicode and alphanumeric characters
PUNCTUATION_REGEX = re.compile(r"[^\w\s\u0B80-\u0BFF]")


def tokenize(text: str) -> List[str]:
    """
    Cleans and tokenizes a sentence into word tokens.
    Strips punctuation, collapses whitespace, and lowercases Latin characters
    while preserving Tamil Unicode characters (U+0B80 to U+0BFF).
    """
    if not text:
        return []
    # Strip punctuation
    cleaned = PUNCTUATION_REGEX.sub(" ", text)
    # Lowercase Latin letters
    cleaned = cleaned.lower()
    # Split by whitespace
    tokens = [t.strip() for t in cleaned.split() if t.strip()]
    return tokens


def compute_wer_and_alignment(
    reference: str,
    hypothesis: str
) -> Dict[str, Any]:
    """
    Calculates Word Error Rate (WER) and word-level alignment between reference and hypothesis.

    Returns:
    {
        "wer": float (e.g. 0.15 = 15% error rate),
        "wer_percent": float (e.g. 15.0),
        "word_accuracy_percent": float (e.g. 85.0),
        "substitutions": int,
        "deletions": int,
        "insertions": int,
        "hits": int,
        "ref_word_count": int,
        "hyp_word_count": int,
        "formula_used": "WER = (S + D + I) / N_ref; Accuracy = max(0, 1 - WER) * 100%",
        "alignment": List[Dict[str, str]]  # list of { "type": "match"|"sub"|"del"|"ins", "ref": ..., "hyp": ... }
    }
    """
    ref_tokens = tokenize(reference)
    hyp_tokens = tokenize(hypothesis)

    n = len(ref_tokens)
    m = len(hyp_tokens)

    # Edge cases
    if n == 0 and m == 0:
        return {
            "wer": 0.0,
            "wer_percent": 0.0,
            "word_accuracy_percent": 100.0,
            "substitutions": 0,
            "deletions": 0,
            "insertions": 0,
            "hits": 0,
            "ref_word_count": 0,
            "hyp_word_count": 0,
            "formula_used": "WER = (S + D + I) / N_ref; Accuracy = max(0, 1 - WER) * 100%",
            "alignment": [],
        }
    if n == 0:
        # All insertions
        return {
            "wer": 1.0,
            "wer_percent": 100.0,
            "word_accuracy_percent": 0.0,
            "substitutions": 0,
            "deletions": 0,
            "insertions": m,
            "hits": 0,
            "ref_word_count": 0,
            "hyp_word_count": m,
            "formula_used": "WER = (S + D + I) / N_ref; Accuracy = max(0, 1 - WER) * 100%",
            "alignment": [{"type": "ins", "ref": "", "hyp": tok} for tok in hyp_tokens],
        }

    # Dynamic Programming table for Levenshtein distance
    # dp[i][j] stores cost to align ref_tokens[:i] with hyp_tokens[:j]
    dp = [[0] * (m + 1) for _ in range(n + 1)]

    for i in range(n + 1):
        dp[i][0] = i  # deletions
    for j in range(m + 1):
        dp[0][j] = j  # insertions

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref_tokens[i - 1] == hyp_tokens[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]  # match (0 cost)
            else:
                substitution = dp[i - 1][j - 1] + 1
                deletion = dp[i - 1][j] + 1
                insertion = dp[i][j - 1] + 1
                dp[i][j] = min(substitution, deletion, insertion)

    # Backtrace to find optimal alignment
    i, j = n, m
    alignment = []
    substitutions = 0
    deletions = 0
    insertions = 0
    hits = 0

    while i > 0 or j > 0:
        if i > 0 and j > 0 and ref_tokens[i - 1] == hyp_tokens[j - 1]:
            alignment.append({"type": "match", "ref": ref_tokens[i - 1], "hyp": hyp_tokens[j - 1]})
            hits += 1
            i -= 1
            j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            alignment.append({"type": "sub", "ref": ref_tokens[i - 1], "hyp": hyp_tokens[j - 1]})
            substitutions += 1
            i -= 1
            j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            alignment.append({"type": "del", "ref": ref_tokens[i - 1], "hyp": ""})
            deletions += 1
            i -= 1
        else:
            alignment.append({"type": "ins", "ref": "", "hyp": hyp_tokens[j - 1]})
            insertions += 1
            j -= 1

    alignment.reverse()

    wer = (substitutions + deletions + insertions) / float(n)
    wer_percent = round(wer * 100.0, 2)
    # Industry standard bounded Word Accuracy
    word_accuracy_percent = round(max(0.0, 1.0 - min(1.0, wer)) * 100.0, 2)

    return {
        "wer": round(wer, 4),
        "wer_percent": wer_percent,
        "word_accuracy_percent": word_accuracy_percent,
        "substitutions": substitutions,
        "deletions": deletions,
        "insertions": insertions,
        "hits": hits,
        "ref_word_count": n,
        "hyp_word_count": m,
        "formula_used": "WER = (S + D + I) / N_ref; Accuracy = max(0, 1 - WER) * 100%",
        "alignment": alignment,
    }

