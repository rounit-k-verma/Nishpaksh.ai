import os
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

app = FastAPI(title="Nishpaksh AI API", version="1.0.0")

default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(default_origins)).split(",")
    if origin.strip()
]

# Allows localhost (dev) + any Netlify subdomain (production)
_CORS_ORIGIN_REGEX = (
    r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    r"|https://[a-z0-9-]+\.netlify\.app"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulateRequest(BaseModel):
    features: dict[str, Any]


audit_state: dict[str, Any] = {}


def _safe_ratio(rates: list[float]) -> float:
    non_zero = [r for r in rates if r > 0]
    if not non_zero:
        return 0.0
    return float(min(non_zero) / max(non_zero))


def _recommendations(disparate_impact_ratio: float, selection_rates: dict[str, float]) -> list[str]:
    recs = [
        "Add fairness checks as a release gate in your MLOps pipeline.",
        "Perform periodic retraining with balanced, representative data.",
    ]
    if disparate_impact_ratio < 0.8:
        recs.insert(0, "Disparate impact is below 0.80. Review decision thresholds and rebalance training data.")
    if max(selection_rates.values()) - min(selection_rates.values()) > 0.15:
        recs.insert(0, "Selection rates vary significantly by group. Investigate proxy features and label quality.")
    recs.append("Document fairness metrics for compliance and stakeholder transparency.")
    return recs


def _resolve_column_name(df: pd.DataFrame, requested: str, aliases: list[str] | None = None) -> str | None:
    normalized_to_actual = {str(col).strip().lower(): str(col) for col in df.columns}
    candidate_names = [requested]
    if aliases:
        candidate_names.extend(aliases)
    for name in candidate_names:
        match = normalized_to_actual.get(str(name).strip().lower())
        if match:
            return match
    return None


@app.get("/")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "Nishpaksh AI backend"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "Nishpaksh AI backend"}


@app.post("/api/audit")
async def audit_dataset(
    file: UploadFile = File(...),
    target_column: str = Form("decision"),
    sensitive_column: str = Form("gender"),
) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    df = pd.read_csv(file.file)
    resolved_target = _resolve_column_name(df, target_column, aliases=["selected", "decision"])
    resolved_sensitive = _resolve_column_name(df, sensitive_column, aliases=["gender"])

    if resolved_target is None or resolved_sensitive is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Could not find target '{target_column}' and/or sensitive '{sensitive_column}'. "
                f"Available columns: {', '.join(map(str, df.columns))}."
            ),
        )

    work_df = df.dropna(subset=[resolved_target, resolved_sensitive]).copy()
    if len(work_df) < 20:
        raise HTTPException(status_code=400, detail="Need at least 20 valid rows for auditing.")

    y_raw = work_df[resolved_target]
    y = (y_raw.astype(str).str.lower().isin(["1", "yes", "true", "selected", "approved", "accept"])).astype(int)
    X = work_df.drop(columns=[resolved_target])

    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [c for c in X.columns if c not in numeric_features]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric_features,
            ),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
        ]
    )

    model = Pipeline(
        [
            ("prep", preprocessor),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    accuracy = float(accuracy_score(y_test, y_pred))

    selection_rate_by_gender: dict[str, float] = {}
    for group in work_df[resolved_sensitive].astype(str).unique():
        mask = work_df[resolved_sensitive].astype(str) == group
        selection_rate_by_gender[group] = float(y[mask].mean())

    disparate_impact_ratio = _safe_ratio(list(selection_rate_by_gender.values()))

    confusion_by_group: dict[str, dict[str, int]] = {}
    sensitive_test = X_test[resolved_sensitive].astype(str)
    for group in sensitive_test.unique():
        g_mask = sensitive_test == group
        if g_mask.sum() == 0:
            continue
        tn, fp, fn, tp = confusion_matrix(y_test[g_mask], y_pred[g_mask], labels=[0, 1]).ravel()
        confusion_by_group[group] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}

    prep = model.named_steps["prep"]
    feature_names = prep.get_feature_names_out()
    coeffs = np.abs(model.named_steps["clf"].coef_[0])
    top_idx = np.argsort(coeffs)[::-1][:20]
    feature_importance = [
        {"feature": str(feature_names[i]), "importance": float(coeffs[i])} for i in top_idx
    ]

    recommendations = _recommendations(disparate_impact_ratio, selection_rate_by_gender)

    audit_state["model"] = model
    audit_state["feature_names"] = list(X.columns)

    return {
        "model_accuracy": accuracy,
        "selection_rate_by_gender": selection_rate_by_gender,
        "disparate_impact_ratio": disparate_impact_ratio,
        "confusion_matrix_by_group": confusion_by_group,
        "feature_importance": feature_importance,
        "recommendations": recommendations,
    }


@app.post("/api/simulate")
def simulate_scenario(request: SimulateRequest) -> dict[str, float]:
    model = audit_state.get("model")
    feature_names = audit_state.get("feature_names")

    if model is None or feature_names is None:
        raise HTTPException(status_code=400, detail="Run /api/audit first before simulation.")

    row = {feature: request.features.get(feature, np.nan) for feature in feature_names}
    frame = pd.DataFrame([row])
    prob = float(model.predict_proba(frame)[0][1])
    pred = int(prob >= 0.5)
    return {"prediction": pred, "probability": prob}
