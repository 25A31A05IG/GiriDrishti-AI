from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os


app = FastAPI(
    title="GiriDrishti ML Service"
)


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "model.joblib"
)


model = None


try:
    model = joblib.load(
        MODEL_PATH
    )

    print(
        "GiriDrishti model loaded"
    )

except Exception as error:
    print(
        "Model loading failed:",
        error
    )


class Features(BaseModel):
    rainfall: float = 0
    soilMoisture: float = 0
    slope: float = 0
    elevation: float = 0
    historicalRisk: float = 0
    latitude: float = 0
    longitude: float = 0


def clamp(
    value,
    minimum=0,
    maximum=100
):
    return max(
        minimum,
        min(
            maximum,
            value
        )
    )


def calculate_rule_score(features):
    rainfall = clamp(
        features.rainfall / 80 * 100
    )

    soil = clamp(
        features.soilMoisture / 0.5 * 100
    )

    slope = clamp(
        features.slope / 45 * 100
    )

    elevation = clamp(
        features.elevation / 3000 * 100
    )

    historical = clamp(
        features.historicalRisk
    )

    score = (
        rainfall * 0.25
        + soil * 0.20
        + slope * 0.20
        + elevation * 0.05
        + historical * 0.30
    )

    return clamp(
        round(score)
    )


@app.get("/health")
def health():
    return {
        "ok": True,
        "modelLoaded": model is not None
    }


@app.post("/predict")
def predict(features: Features):

    rule_score = calculate_rule_score(
        features
    )

    ai_score = None
    probability = None

    if model is not None:

        try:

            values = [[
                features.rainfall,
                features.soilMoisture,
                features.slope,
                features.elevation,
                features.historicalRisk
            ]]

            if hasattr(
                model,
                "predict_proba"
            ):

                probabilities = model.predict_proba(
                    values
                )

                probability = float(
                    probabilities[0][-1]
                )

                ai_score = round(
                    probability * 100
                )

            else:

                prediction = model.predict(
                    values
                )[0]

                ai_score = round(
                    float(prediction) * 100
                )

        except Exception as error:

            print(
                "AI prediction failed:",
                error
            )

    if ai_score is None:

        ai_score = rule_score

    # Blend AI prediction with the
    # rule-based environmental assessment.
    # This prevents one model output from
    # suppressing strong risk evidence.

    risk_score = round(
        ai_score * 0.60
        + rule_score * 0.40
    )

    risk_score = clamp(
        risk_score
    )

    if risk_score >= 85:

        risk_level = "CRITICAL"

    elif risk_score >= 65:

        risk_level = "HIGH"

    elif risk_score >= 40:

        risk_level = "MODERATE"

    else:

        risk_level = "LOW"

    return {
        "probability": (
            probability
            if probability is not None
            else risk_score / 100
        ),

        "aiScore": ai_score,

        "historicalRisk": (
            features.historicalRisk
        ),

        "riskScore": risk_score,

        "riskLevel": risk_level
    }