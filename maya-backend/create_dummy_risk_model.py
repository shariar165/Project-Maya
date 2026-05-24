"""
Run this once to generate models/risk_model.pkl.
Trains a RandomForestClassifier on synthetic maternal risk data.
"""
import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier

os.makedirs("models", exist_ok=True)

rng = np.random.default_rng(42)
n   = 500

# Features: [age, pregnancy_week, avg_systolic_bp, bp_std, symptom_count, is_high_risk_flag]
age             = rng.integers(18, 42, n).astype(float)
week            = rng.integers(4, 41, n).astype(float)
avg_bp          = rng.normal(120, 15, n)
bp_std          = rng.uniform(0, 20, n)
symptom_count   = rng.integers(0, 12, n).astype(float)
is_high_risk    = rng.integers(0, 2, n).astype(float)

X = np.column_stack([age, week, avg_bp, bp_std, symptom_count, is_high_risk])

# Target: high risk if BP > 140, or >4 symptoms + is_high_risk, or age > 38 + high BP
y = (
    (avg_bp > 140)
    | ((symptom_count > 4) & (is_high_risk == 1))
    | ((age > 38) & (avg_bp > 130))
).astype(int)

# Add some noise to make it realistic
flip_idx = rng.choice(n, size=20, replace=False)
y[flip_idx] = 1 - y[flip_idx]

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

with open("models/risk_model.pkl", "wb") as f:
    pickle.dump(model, f)

print(f"[Setup] Risk model trained on {n} samples, saved to models/risk_model.pkl")
print(f"[Setup] Positive class rate: {y.mean():.1%}")
