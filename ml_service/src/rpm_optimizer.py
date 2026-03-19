"""
RPM Optimizer Module (Model 2)

Recommends optimal RPM to minimize energy per ton based on:
- Ore Type (hard/medium/soft) - from Model 1
- Feed Rate (TPH)
- Feed Size (mm)
"""

import logging
import numpy as np
from typing import Dict, Any, Optional, Tuple
from scipy.optimize import minimize_scalar
from .model_loader import get_model_loader

logger = logging.getLogger(__name__)


class RPMOptimizer:
    """RPM optimizer using energy prediction model."""
    
    def __init__(self, model_loader=None):
        """
        Initialize RPM optimizer.
        
        Args:
            model_loader: Optional ModelLoader instance
        """
        self.model_loader = model_loader or get_model_loader()
        self.model = None
        self.scaler = None
        self.encoder = None
        self._is_loaded = False
        
        # RPM optimization bounds (adjust based on your equipment)
        self.min_rpm = 800
        self.max_rpm = 1200
        
        # CSS bounds (from model documentation: 3-15 mm)
        # Note: Model uses CSS (Closed Side Setting) which correlates with RPM
        self.min_css = 3.0
        self.max_css = 15.0
    
    def load_models(self):
        """Load model components (lazy loading)."""
        if not self._is_loaded:
            self.model, self.scaler, self.encoder = self.model_loader.load_rpm_optimizer()
            self._is_loaded = True
            logger.info("RPM optimizer models loaded")
    
    def validate_inputs(
        self,
        ore_type: str,
        feed_rate_tph: float,
        feed_size_mm: float,
        css_mm: Optional[float] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate input parameters.
        
        Args:
            ore_type: Ore type (hard/medium/soft)
            feed_rate_tph: Feed rate in tons per hour
            feed_size_mm: Feed size in millimeters
            css_mm: Optional CSS setting in mm
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Validate ore type
        valid_ore_types = ['hard', 'medium', 'soft', 'Hard', 'Medium', 'Soft', 
                          'HARD', 'MEDIUM', 'SOFT', 'Very_Hard', 'very_hard', 'VERY_HARD']
        
        if ore_type not in valid_ore_types:
            # Check if it's in encoder classes
            self.load_models()
            if ore_type not in self.encoder.classes_:
                return False, f"Invalid ore type: {ore_type}. Must be one of: {list(self.encoder.classes_)}"
        
        # Normalize ore type
        ore_type_lower = ore_type.lower()
        if ore_type_lower == 'very_hard' or ore_type_lower == 'very hard':
            ore_type = 'Very_Hard'
        elif ore_type_lower == 'hard':
            ore_type = 'Hard'
        elif ore_type_lower == 'medium':
            ore_type = 'Medium'
        elif ore_type_lower == 'soft':
            ore_type = 'Soft'
        
        if feed_rate_tph is None or feed_rate_tph <= 0:
            return False, "Feed Rate (TPH) must be a positive number"
        
        if feed_rate_tph < 111 or feed_rate_tph > 550:
            logger.warning(f"Feed Rate ({feed_rate_tph} TPH) is outside typical range (111-550 TPH)")
        
        if feed_size_mm is None or feed_size_mm <= 0:
            return False, "Feed Size (mm) must be a positive number"
        
        if feed_size_mm < 70 or feed_size_mm > 110:
            logger.warning(f"Feed Size ({feed_size_mm} mm) is outside typical range (70-110 mm)")
        
        if css_mm is not None:
            if css_mm < self.min_css or css_mm > self.max_css:
                return False, f"CSS ({css_mm} mm) must be between {self.min_css} and {self.max_css} mm"
        
        return True, None
    
    def predict_energy(
        self,
        ore_type: str,
        feed_rate_tph: float,
        feed_size_mm: float,
        css_mm: float
    ) -> float:
        """
        Predict energy consumption for given parameters.
        
        Args:
            ore_type: Ore type (Hard/Medium/Soft/Very_Hard)
            feed_rate_tph: Feed rate in tons per hour
            feed_size_mm: Feed size in millimeters
            css_mm: CSS setting in millimeters
            
        Returns:
            Predicted energy consumption (kWh/ton)
        """
        self.load_models()
        
        try:
            # Encode ore type
            ore_idx = list(self.encoder.classes_).index(ore_type)
            
            # Prepare features: [ore_type_encoded, feed_rate, feed_size, css]
            features = np.array([[ore_idx, feed_rate_tph, feed_size_mm, css_mm]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Predict energy
            predicted_energy = self.model.predict(features_scaled)[0]
            
            return float(predicted_energy)
            
        except Exception as e:
            logger.error(f"Error predicting energy: {str(e)}", exc_info=True)
            raise
    
    def optimize_css(
        self,
        ore_type: str,
        feed_rate_tph: float,
        feed_size_mm: float
    ) -> Dict[str, Any]:
        """
        Find optimal CSS (Closed Side Setting) that minimizes energy consumption.
        
        Args:
            ore_type: Ore type (Hard/Medium/Soft/Very_Hard)
            feed_rate_tph: Feed rate in tons per hour
            feed_size_mm: Feed size in millimeters
            
        Returns:
            Dictionary with optimal CSS, predicted energy, and optimization details
        """
        self.load_models()
        
        try:
            # Objective function: minimize energy
            def energy_objective(css):
                try:
                    energy = self.predict_energy(ore_type, feed_rate_tph, feed_size_mm, css)
                    return energy
                except Exception as e:
                    logger.error(f"Error in objective function: {e}")
                    return float('inf')
            
            # Optimize CSS using scipy
            result = minimize_scalar(
                energy_objective,
                bounds=(self.min_css, self.max_css),
                method='bounded'
            )
            
            optimal_css = float(result.x)
            optimal_energy = float(result.fun)
            
            return {
                "optimal_css_mm": optimal_css,
                "predicted_energy_kwh_per_ton": optimal_energy,
                "optimization_success": result.success,
                "optimization_message": result.message if hasattr(result, 'message') else "Optimization completed"
            }
            
        except Exception as e:
            logger.error(f"Error optimizing CSS: {str(e)}", exc_info=True)
            # Fallback: use model's known optimal values
            optimal_values = {
                'Soft': 14.74,
                'Medium': 14.94,
                'Hard': 15.00,
                'Very_Hard': 15.00
            }
            
            fallback_css = optimal_values.get(ore_type, 14.0)
            fallback_energy = self.predict_energy(ore_type, feed_rate_tph, feed_size_mm, fallback_css)
            
            return {
                "optimal_css_mm": fallback_css,
                "predicted_energy_kwh_per_ton": fallback_energy,
                "optimization_success": False,
                "optimization_message": f"Used fallback value due to optimization error: {str(e)}"
            }
    
    def css_to_rpm(self, css_mm: float) -> float:
        """
        Convert CSS (Closed Side Setting) to RPM.
        
        Note: This is a simplified conversion. Adjust based on your equipment.
        Typically: Lower CSS = Higher RPM, Higher CSS = Lower RPM
        
        Args:
            css_mm: CSS setting in millimeters
            
        Returns:
            Recommended RPM value
        """
        # Simplified linear relationship (adjust based on your crusher specifications)
        # CSS range: 3-15 mm
        # RPM range: 1200-800 RPM (inverse relationship)
        
        css_normalized = (css_mm - self.min_css) / (self.max_css - self.min_css)
        rpm = self.max_rpm - (css_normalized * (self.max_rpm - self.min_rpm))
        
        return round(float(rpm), 1)
    
    def recommend_optimal_rpm(
        self,
        ore_type: str,
        feed_rate_tph: float,
        feed_size_mm: float,
        current_rpm: Optional[float] = None,
        optimize: bool = True
    ) -> Dict[str, Any]:
        """
        Recommend optimal RPM to minimize energy consumption.
        
        Args:
            ore_type: Ore type (hard/medium/soft) - from Model 1
            feed_rate_tph: Feed rate in tons per hour
            feed_size_mm: Feed size in millimeters
            current_rpm: Optional current RPM (for comparison)
            optimize: Whether to optimize CSS or use fixed value
            
        Returns:
            Dictionary containing:
            - recommended_rpm: float
            - predicted_energy: float (kWh/ton)
            - optimal_css_mm: float
            - confidence: str (High/Medium/Low)
            - energy_savings_pct: float (if current_rpm provided)
            - error: str (if any error occurred)
        """
        self.load_models()
        
        # Normalize ore type to match encoder
        ore_type_normalized = ore_type
        if ore_type.lower() in ['hard', 'medium', 'soft']:
            ore_type_normalized = ore_type.capitalize()
        elif 'very' in ore_type.lower() or 'very_hard' in ore_type.lower():
            ore_type_normalized = 'Very_Hard'
        
        # Validate inputs
        is_valid, error_msg = self.validate_inputs(ore_type_normalized, feed_rate_tph, feed_size_mm)
        if not is_valid:
            return {
                "recommended_rpm": None,
                "predicted_energy_kwh_per_ton": None,
                "optimal_css_mm": None,
                "confidence": "Low",
                "energy_savings_pct": 0.0,
                "error": error_msg
            }
        
        try:
            if optimize:
                # Find optimal CSS
                optimization_result = self.optimize_css(ore_type_normalized, feed_rate_tph, feed_size_mm)
                optimal_css = optimization_result["optimal_css_mm"]
                predicted_energy = optimization_result["predicted_energy_kwh_per_ton"]
            else:
                # Use known optimal values from model documentation
                optimal_values = {
                    'Soft': 14.74,
                    'Medium': 14.94,
                    'Hard': 15.00,
                    'Very_Hard': 15.00
                }
                optimal_css = optimal_values.get(ore_type_normalized, 14.0)
                predicted_energy = self.predict_energy(ore_type_normalized, feed_rate_tph, feed_size_mm, optimal_css)
            
            # Convert CSS to RPM
            recommended_rpm = self.css_to_rpm(optimal_css)
            
            # Calculate confidence based on energy prediction
            if 2.0 <= predicted_energy <= 4.0:
                confidence = "High"
            elif predicted_energy < 2.0 or predicted_energy <= 5.0:
                confidence = "Medium"
            else:
                confidence = "Low"
            
            # Calculate energy savings if current RPM provided
            energy_savings_pct = 0.0
            if current_rpm is not None:
                # Estimate current energy (use CSS conversion backwards)
                current_css = self.rpm_to_css(current_rpm)
                current_energy = self.predict_energy(ore_type_normalized, feed_rate_tph, feed_size_mm, current_css)
                
                if current_energy > predicted_energy:
                    energy_savings_pct = ((current_energy - predicted_energy) / current_energy) * 100
            
            logger.debug(
                f"RPM Recommendation: {recommended_rpm} RPM for {ore_type_normalized} ore "
                f"(predicted energy: {predicted_energy:.4f} kWh/ton)"
            )
            
            return {
                "recommended_rpm": recommended_rpm,
                "predicted_energy_kwh_per_ton": round(predicted_energy, 4),
                "optimal_css_mm": round(optimal_css, 2),
                "confidence": confidence,
                "energy_savings_pct": round(energy_savings_pct, 2),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error during RPM recommendation: {str(e)}", exc_info=True)
            return {
                "recommended_rpm": None,
                "predicted_energy_kwh_per_ton": None,
                "optimal_css_mm": None,
                "confidence": "Low",
                "energy_savings_pct": 0.0,
                "error": f"RPM optimization error: {str(e)}"
            }
    
    def rpm_to_css(self, rpm: float) -> float:
        """
        Convert RPM to CSS (inverse of css_to_rpm).
        
        Args:
            rpm: RPM value
            
        Returns:
            Estimated CSS in millimeters
        """
        # Inverse of css_to_rpm conversion
        rpm_normalized = (self.max_rpm - rpm) / (self.max_rpm - self.min_rpm)
        css = self.min_css + (rpm_normalized * (self.max_css - self.min_css))
        
        return float(css)


# Global optimizer instance (lazy initialization)
_optimizer_instance: Optional[RPMOptimizer] = None


def get_optimizer() -> RPMOptimizer:
    """Get or create global optimizer instance."""
    global _optimizer_instance
    
    if _optimizer_instance is None:
        _optimizer_instance = RPMOptimizer()
    
    return _optimizer_instance


# Convenience function for easy usage
def recommend_optimal_rpm(
    ore_type: str,
    feed_rate_tph: float,
    feed_size_mm: float,
    current_rpm: Optional[float] = None
) -> Dict[str, Any]:
    """
    Recommend optimal RPM (convenience function).
    
    Args:
        ore_type: Ore type (hard/medium/soft)
        feed_rate_tph: Feed rate in tons per hour
        feed_size_mm: Feed size in millimeters
        current_rpm: Optional current RPM
        
    Returns:
        RPM recommendation dictionary
    """
    optimizer = get_optimizer()
    return optimizer.recommend_optimal_rpm(ore_type, feed_rate_tph, feed_size_mm, current_rpm)

