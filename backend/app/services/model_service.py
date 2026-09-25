import os
import logging
from typing import Optional, Any, Dict

logger = logging.getLogger("flood_backend.model_service")

# Standard location for the trained model artifact
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
DEFAULT_MODEL_PATH = os.path.join(MODEL_DIR, "flood_prediction_model.pkl")


class ModelService:
    """
    Dedicated AI model-loading and inference service.
    
    Responsibilities:
    - Load `flood_prediction_model.pkl` once at startup or on first call.
    - Expose clean prediction functionality for validated feature inputs.
    - Handle missing model artifacts, corrupted files, and loading errors cleanly.
    - DO NOT implement fake predictions, pseudo-random guesses, or simulated probabilities.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("FLOOD_MODEL_PATH", DEFAULT_MODEL_PATH)
        self._model: Optional[Any] = None
        self._is_loaded: bool = False
        self._load_error: Optional[str] = None

    def load_model(self) -> bool:
        """
        Loads the pickled model artifact into memory if available.
        Does not crash the application if the file is absent; instead,
        flags that the model is pending integration.
        """
        if self._is_loaded and self._model is not None:
            return True

        if not os.path.exists(self.model_path):
            self._load_error = f"Model artifact not found at '{self.model_path}'."
            logger.info(
                f"[ModelService] {self._load_error} AI model inference pending file deployment."
            )
            return False

        try:
            # We attempt loading via joblib first (standard for scikit-learn models), then pickle
            try:
                import joblib
                self._model = joblib.load(self.model_path)
            except ImportError:
                import pickle
                with open(self.model_path, "rb") as f:
                    self._model = pickle.load(f)

            self._is_loaded = True
            self._load_error = None
            logger.info(f"[ModelService] Successfully loaded trained model from {self.model_path}")
            return True
        except Exception as e:
            self._load_error = f"Error loading model artifact: {str(e)}"
            logger.error(f"[ModelService] {self._load_error}", exc_info=True)
            self._model = None
            self._is_loaded = False
            return False

    @property
    def is_model_available(self) -> bool:
        if not self._is_loaded:
            self.load_model()
        return self._is_loaded and self._model is not None

    def get_load_status(self) -> Dict[str, Any]:
        return {
            "model_path": self.model_path,
            "is_loaded": self.is_model_available,
            "error": self._load_error,
        }

    def predict(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference using the loaded model artifact.
        
        CRITICAL:
        If the model is not loaded, this method does NOT generate fake or simulated values.
        It returns a status indicating the model is unavailable.
        """
        if not self.is_model_available:
            return {
                "success": False,
                "error": "MODEL_UNAVAILABLE",
                "message": (
                    f"AI model artifact ('flood_prediction_model.pkl') is not currently loaded. "
                    f"Status: {self._load_error or 'Awaiting model deployment'}"
                ),
                "flood_probability": None,
                "flood_occurred": None,
            }

        try:
            # When model artifact is loaded, prepare feature vector according to model expectations
            # (e.g., pandas DataFrame or 2D array depending on pipeline)
            # The actual feature array structure will align with the trained model's feature names
            if hasattr(self._model, "predict_proba"):
                # Probabilistic classifier (e.g., RandomForestClassifier, XGBoostClassifier)
                proba = self._model.predict_proba([list(feature_dict.values())])
                # Typically index 1 represents probability of flood event
                prob_value = float(proba[0][1]) if len(proba[0]) > 1 else float(proba[0][0])
                flood_flag = int(prob_value >= 0.5)
            elif hasattr(self._model, "predict"):
                pred = self._model.predict([list(feature_dict.values())])
                prob_value = float(pred[0])
                flood_flag = int(prob_value >= 0.5)
            else:
                return {
                    "success": False,
                    "error": "INVALID_MODEL_INTERFACE",
                    "message": "Loaded model does not implement predict or predict_proba methods.",
                    "flood_probability": None,
                    "flood_occurred": None,
                }

            return {
                "success": True,
                "flood_probability": round(prob_value, 4),
                "flood_occurred": flood_flag,
                "error": None,
            }
        except Exception as e:
            logger.error(f"[ModelService] Inference failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": "INFERENCE_ERROR",
                "message": f"Inference execution failed: {str(e)}",
                "flood_probability": None,
                "flood_occurred": None,
            }


# Singleton instance
model_service = ModelService()
