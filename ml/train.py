import os
import joblib
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report


print("==========================================")
print("GiriDrishti AI Model Training")
print("==========================================")


rng = np.random.default_rng(42)

n = 10000


rainfall = rng.uniform(
    0,
    250,
    n
)

soil = rng.uniform(
    0,
    100,
    n
)

slope = rng.uniform(
    0,
    60,
    n
)

elevation = rng.uniform(
    0,
    4000,
    n
)

historical = rng.uniform(
    0,
    100,
    n
)


score = (
    0.35 * np.clip(
        rainfall / 180,
        0,
        1
    )
    +
    0.25 * (soil / 100)
    +
    0.22 * np.clip(
        slope / 45,
        0,
        1
    )
    +
    0.10 * (historical / 100)
    +
    0.08 * np.clip(
        elevation / 3500,
        0,
        1
    )
)


score += rng.normal(
    0,
    0.04,
    n
)


labels = np.zeros(
    n,
    dtype=int
)

labels[
    score >= 0.30
] = 1

labels[
    score >= 0.50
] = 2

labels[
    score >= 0.70
] = 3


X = np.column_stack([
    rainfall,
    soil,
    slope,
    elevation,
    historical
])


X_train, X_test, y_train, y_test = train_test_split(
    X,
    labels,
    test_size=0.2,
    random_state=42,
    stratify=labels
)


model = RandomForestClassifier(
    n_estimators=300,
    max_depth=14,
    random_state=42,
    n_jobs=-1
)


print("Training model...")

model.fit(
    X_train,
    y_train
)


predictions = model.predict(
    X_test
)


accuracy = accuracy_score(
    y_test,
    predictions
)


print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

print(
    classification_report(
        y_test,
        predictions
    )
)


model_path = os.path.join(
    os.path.dirname(
        os.path.abspath(__file__)
    ),
    "model.joblib"
)


joblib.dump(
    model,
    model_path
)


print("model.joblib created")
print("Training complete")