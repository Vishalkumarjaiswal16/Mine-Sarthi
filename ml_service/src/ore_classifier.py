"""
Ore Hardness Classifier Module (Model 1)

Classifies ore hardness (hard/medium/soft) based on sensor readings:
- Power (kW)
- Feed Rate (TPH)
- Feed Size (mm)
"""

import logging
import numpy as np
from typing import Dict, Any, Optional, Tuple
from .model_loader import get_model_loader

logger = logging.getLogger(__name__)


class OreClassifier:
    """Ore hardness classifier using Random Forest model."""
    
    def __init__(self, model_loader=None):
        """
        Initialize ore classifier.
        
        Args:
            model_loader: Optional ModelLoader instance
        """
        self.model_loader = model_loader or get_model_loader()
        self.classifier = None
        self.scaler = None
        self.label_encoder = None
        self._is_loaded = False
    
    def load_models(self):
        """Load model components (lazy loading)."""
        if not self._is_loaded:
            self.classifier, self.scaler, self.label_encoder = self.model_loader.load_ore_classifier()
            self._is_loaded = True
            logger.info("Ore classifier models loaded")
    
    def validate_inputs(self, power_kw: float, feed_rate_tph: float, feed_size_mm: float) -> Tuple[bool, Optional[str]]:
        """
        Validate input parameters.
        
        Args:
            power_kw: Power consumption in kW
            feed_rate_tph: Feed rate in tons per hour
            feed_size_mm: Feed size in millimeters
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if power_kw is None or power_kw < 0:
            return False, "Power (kW) must be a positive number"
        
        if feed_rate_tph is None or feed_rate_tph <= 0:
            return False, "Feed Rate (TPH) must be a positive number"
        
        if feed_size_mm is None or feed_size_mm <= 0:
            return False, "Feed Size (mm) must be a positive number"
        
        # Reasonable ranges (adjust based on your equipment)
        if power_kw > 10000:
            return False, f"Power ({power_kw} kW) is unreasonably high"
        
        if feed_rate_tph > 1000:
            return False, f"Feed Rate ({feed_rate_tph} TPH) is unreasonably high"
        
        if feed_size_mm > 500:
            return False, f"Feed Size ({feed_size_mm} mm) is unreasonably large"
        
        return True, None
    
    def classify_ore_hardness(
        self,
        power_kw: float,
        feed_rate_tph: float,
        feed_size_mm: float
    ) -> Dict[str, Any]:
        """
        Classify ore hardness from sensor readings.
        
        Args:
            power_kw: Power consumption in kW
            feed_rate_tph: Feed rate in tons per hour
            feed_size_mm: Feed size in millimeters
            
        Returns:
            Dictionary containing:
            - predicted_class: str (hard/medium/soft)
            - probabilities: dict with probabilities for each class
            - confidence: float (max probability)
            - raw_features: list of input features
            - error: str (if any error occurred)
        """
        # Load models if not already loaded
        self.load_models()
        
        # Validate inputs
        is_valid, error_msg = self.validate_inputs(power_kw, feed_rate_tph, feed_size_mm)
        if not is_valid:
            return {
                "predicted_class": None,
                "probabilities": {},
                "confidence": 0.0,
                "raw_features": [power_kw, feed_rate_tph, feed_size_mm],
                "error": error_msg
            }
        
        try:
            # Prepare features: [Power, Feed Rate, Feed Size]
            features = np.array([[power_kw, feed_rate_tph, feed_size_mm]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Predict class probabilities
            probabilities = self.classifier.predict_proba(features_scaled)[0]
            
            # Predict class
            predicted_idx = self.classifier.predict(features_scaled)[0]
            
            # Decode label
            predicted_class = self.label_encoder.inverse_transform([predicted_idx])[0]
            
            # Get class names from encoder
            class_names = list(self.label_encoder.classes_)
            
            # Create probabilities dictionary
            prob_dict = {}
            for idx, class_name in enumerate(class_names):
                prob_dict[class_name] = float(probabilities[idx])
            
            # Calculate confidence (max probability)
            confidence = float(np.max(probabilities))
            
            logger.debug(
                f"Classification: {predicted_class} (confidence: {confidence:.2%}) "
                f"from inputs: power={power_kw}kW, feed_rate={feed_rate_tph}TPH, feed_size={feed_size_mm}mm"
            )
            
            return {
                "predicted_class": str(predicted_class),
                "probabilities": prob_dict,
                "confidence": confidence,
                "raw_features": [float(power_kw), float(feed_rate_tph), float(feed_size_mm)],
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error during classification: {str(e)}", exc_info=True)
            return {
                "predicted_class": None,
                "probabilities": {},
                "confidence": 0.0,
                "raw_features": [power_kw, feed_rate_tph, feed_size_mm],
                "error": f"Classification error: {str(e)}"
            }


# Global classifier instance (lazy initialization)
_classifier_instance: Optional[OreClassifier] = None


def get_classifier() -> OreClassifier:
    """Get or create global classifier instance."""
    global _classifier_instance
    
    if _classifier_instance is None:
        _classifier_instance = OreClassifier()
    
    return _classifier_instance


# Convenience function for easy usage
def classify_ore_hardness(power_kw: float, feed_rate_tph: float, feed_size_mm: float) -> Dict[str, Any]:
    """
    Classify ore hardness (convenience function).
    
    Args:
        power_kw: Power consumption in kW
        feed_rate_tph: Feed rate in tons per hour
        feed_size_mm: Feed size in millimeters
        
    Returns:
        Classification result dictionary
    """
    classifier = get_classifier()
    return classifier.classify_ore_hardness(power_kw, feed_rate_tph, feed_size_mm)

