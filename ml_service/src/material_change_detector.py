"""
Material Change Detection Module

Detects when feed material characteristics change significantly based on:
- Ore hardness class transitions (hard → soft or vice versa)
- Energy consumption deviations (>15% from baseline)
- Feed fines percentage changes (>20%)
- Power consumption patterns

Features:
- Rolling window analysis (last 5-10 predictions)
- Variance calculation for material properties
- Change event triggering
"""

import logging
import numpy as np
from typing import Dict, Any, Optional, List, Callable
from collections import deque
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class MaterialChangeDetector:
    """Detects significant changes in material characteristics."""
    
    def __init__(
        self,
        window_size: int = 10,
        hardness_change_threshold: float = 0.5,
        energy_deviation_threshold: float = 0.15,
        fines_change_threshold: float = 0.20,
        min_samples_for_detection: int = 3
    ):
        """
        Initialize material change detector.
        
        Args:
            window_size: Number of recent predictions to analyze (default: 10)
            hardness_change_threshold: Minimum probability change to trigger (default: 0.5)
            energy_deviation_threshold: Energy deviation threshold (15% default)
            fines_change_threshold: Fines percentage change threshold (20% default)
            min_samples_for_detection: Minimum samples needed before detecting changes (default: 3)
        """
        self.window_size = window_size
        self.hardness_change_threshold = hardness_change_threshold
        self.energy_deviation_threshold = energy_deviation_threshold
        self.fines_change_threshold = fines_change_threshold
        self.min_samples_for_detection = min_samples_for_detection
        
        # Prediction history
        self.prediction_history: deque = deque(maxlen=window_size)
        self.baseline_energy: Optional[float] = None
        self.baseline_fines: Optional[float] = None
        
        # Change callbacks
        self.on_material_change: Optional[Callable[[Dict[str, Any]], None]] = None
        
        logger.info(
            f"MaterialChangeDetector initialized: "
            f"window_size={window_size}, "
            f"energy_threshold={energy_deviation_threshold:.1%}, "
            f"fines_threshold={fines_change_threshold:.1%}"
        )
    
    def add_prediction(self, prediction: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Add a new prediction and check for material changes.
        
        Args:
            prediction: Prediction result dictionary from prediction pipeline
            
        Returns:
            Change event dictionary if change detected, None otherwise
        """
        # Extract relevant data
        ore_classification = prediction.get("ore_classification", {})
        rpm_recommendation = prediction.get("rpm_recommendation", {})
        input_data = prediction.get("input", {})
        
        # Extract material properties
        predicted_class = ore_classification.get("predicted_class")
        confidence = ore_classification.get("confidence", 0.0)
        predicted_energy = rpm_recommendation.get("predicted_energy_kwh_per_ton")
        ore_fines_pct = input_data.get("ore_fines_pct")  # May not always be available
        
        # Create prediction record
        prediction_record = {
            "timestamp": prediction.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "predicted_class": predicted_class,
            "confidence": confidence,
            "probabilities": ore_classification.get("probabilities", {}),
            "predicted_energy": predicted_energy,
            "ore_fines_pct": ore_fines_pct,
            "power_kw": input_data.get("power_kw"),
            "feed_rate_tph": input_data.get("feed_rate_tph"),
            "raw_prediction": prediction
        }
        
        # Add to history
        self.prediction_history.append(prediction_record)
        
        # Need minimum samples before detecting changes
        if len(self.prediction_history) < self.min_samples_for_detection:
            # Initialize baseline
            if predicted_energy and self.baseline_energy is None:
                self.baseline_energy = predicted_energy
            if ore_fines_pct and self.baseline_fines is None:
                self.baseline_fines = ore_fines_pct
            
            return None
        
        # Check for material changes
        change_event = self._detect_changes(prediction_record)
        
        if change_event:
            logger.info(
                f"Material change detected: {change_event.get('change_type')} - "
                f"{change_event.get('description')}"
            )
            
            # Update baselines
            if predicted_energy:
                self.baseline_energy = predicted_energy
            if ore_fines_pct:
                self.baseline_fines = ore_fines_pct
            
            # Call callback if registered
            if self.on_material_change:
                try:
                    self.on_material_change(change_event)
                except Exception as e:
                    logger.error(f"Error in on_material_change callback: {e}", exc_info=True)
        
        return change_event
    
    def _detect_changes(self, latest_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Detect material property changes.
        
        Args:
            latest_record: Latest prediction record
            
        Returns:
            Change event dictionary if change detected, None otherwise
        """
        if len(self.prediction_history) < self.min_samples_for_detection:
            return None
        
        # Get recent history (excluding the latest one we just added)
        recent_history = list(self.prediction_history)[:-1]
        if len(recent_history) < self.min_samples_for_detection - 1:
            return None
        
        change_events = []
        
        # 1. Check for ore hardness class change
        hardness_change = self._detect_hardness_change(recent_history, latest_record)
        if hardness_change:
            change_events.append(hardness_change)
        
        # 2. Check for energy consumption deviation
        energy_change = self._detect_energy_deviation(recent_history, latest_record)
        if energy_change:
            change_events.append(energy_change)
        
        # 3. Check for fines percentage change
        fines_change = self._detect_fines_change(recent_history, latest_record)
        if fines_change:
            change_events.append(fines_change)
        
        # 4. Check for power consumption pattern change
        power_change = self._detect_power_pattern_change(recent_history, latest_record)
        if power_change:
            change_events.append(power_change)
        
        # Return the most significant change event
        if change_events:
            # Prioritize hardness changes
            hardness_events = [e for e in change_events if e.get("change_type") == "hardness_change"]
            if hardness_events:
                return hardness_events[0]
            
            # Then energy deviations
            energy_events = [e for e in change_events if e.get("change_type") == "energy_deviation"]
            if energy_events:
                return energy_events[0]
            
            # Return first change event
            return change_events[0]
        
        return None
    
    def _detect_hardness_change(
        self,
        recent_history: List[Dict[str, Any]],
        latest_record: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Detect ore hardness class transitions."""
        latest_class = latest_record.get("predicted_class")
        latest_confidence = latest_record.get("confidence", 0.0)
        
        if not latest_class or latest_confidence < 0.7:
            return None
        
        # Get most common class in recent history
        recent_classes = [r.get("predicted_class") for r in recent_history if r.get("predicted_class")]
        if not recent_classes:
            return None
        
        # Count class occurrences
        from collections import Counter
        class_counts = Counter(recent_classes)
        most_common_class = class_counts.most_common(1)[0][0]
        
        # Check if class changed
        if latest_class != most_common_class:
            # Calculate probability change
            latest_probs = latest_record.get("probabilities", {})
            recent_probs_list = [r.get("probabilities", {}) for r in recent_history]
            
            # Average probabilities in recent history
            avg_recent_probs = {}
            for prob_dict in recent_probs_list:
                for class_name, prob in prob_dict.items():
                    avg_recent_probs[class_name] = avg_recent_probs.get(class_name, 0.0) + prob
            for class_name in avg_recent_probs:
                avg_recent_probs[class_name] /= len(recent_probs_list)
            
            # Calculate change magnitude
            latest_prob = latest_probs.get(latest_class, 0.0)
            recent_prob = avg_recent_probs.get(latest_class, 0.0)
            change_magnitude = abs(latest_prob - recent_prob)
            
            if change_magnitude >= self.hardness_change_threshold:
                return {
                    "change_type": "hardness_change",
                    "description": f"Ore hardness changed from {most_common_class} to {latest_class}",
                    "previous_class": most_common_class,
                    "current_class": latest_class,
                    "confidence": latest_confidence,
                    "change_magnitude": change_magnitude,
                    "timestamp": latest_record.get("timestamp"),
                    "prediction": latest_record.get("raw_prediction")
                }
        
        return None
    
    def _detect_energy_deviation(
        self,
        recent_history: List[Dict[str, Any]],
        latest_record: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Detect energy consumption deviations from baseline."""
        latest_energy = latest_record.get("predicted_energy")
        
        if latest_energy is None:
            return None
        
        # Calculate baseline from recent history
        recent_energies = [
            r.get("predicted_energy")
            for r in recent_history
            if r.get("predicted_energy") is not None
        ]
        
        if not recent_energies:
            return None
        
        baseline = np.mean(recent_energies)
        
        # Check deviation
        deviation = abs(latest_energy - baseline) / baseline if baseline > 0 else 0
        
        if deviation >= self.energy_deviation_threshold:
            direction = "increase" if latest_energy > baseline else "decrease"
            return {
                "change_type": "energy_deviation",
                "description": f"Energy consumption {direction}d by {deviation:.1%} "
                              f"({baseline:.4f} → {latest_energy:.4f} kWh/ton)",
                "baseline_energy": baseline,
                "current_energy": latest_energy,
                "deviation_pct": deviation * 100,
                "direction": direction,
                "timestamp": latest_record.get("timestamp"),
                "prediction": latest_record.get("raw_prediction")
            }
        
        return None
    
    def _detect_fines_change(
        self,
        recent_history: List[Dict[str, Any]],
        latest_record: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Detect feed fines percentage changes."""
        latest_fines = latest_record.get("ore_fines_pct")
        
        if latest_fines is None:
            return None
        
        # Get baseline from recent history
        recent_fines = [
            r.get("ore_fines_pct")
            for r in recent_history
            if r.get("ore_fines_pct") is not None
        ]
        
        if not recent_fines:
            return None
        
        baseline = np.mean(recent_fines)
        
        # Check change
        change = abs(latest_fines - baseline) / baseline if baseline > 0 else abs(latest_fines - baseline)
        
        if change >= self.fines_change_threshold:
            direction = "increase" if latest_fines > baseline else "decrease"
            return {
                "change_type": "fines_change",
                "description": f"Feed fines percentage {direction}d by {change:.1%} "
                              f"({baseline:.1f}% → {latest_fines:.1f}%)",
                "baseline_fines": baseline,
                "current_fines": latest_fines,
                "change_pct": change * 100,
                "direction": direction,
                "timestamp": latest_record.get("timestamp"),
                "prediction": latest_record.get("raw_prediction")
            }
        
        return None
    
    def _detect_power_pattern_change(
        self,
        recent_history: List[Dict[str, Any]],
        latest_record: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Detect power consumption pattern changes."""
        latest_power = latest_record.get("power_kw")
        
        if latest_power is None:
            return None
        
        # Get power values from recent history
        recent_powers = [
            r.get("power_kw")
            for r in recent_history
            if r.get("power_kw") is not None
        ]
        
        if len(recent_powers) < 3:
            return None
        
        # Calculate statistics
        avg_power = np.mean(recent_powers)
        std_power = np.std(recent_powers)
        
        # Check if latest power is significantly different (more than 2 standard deviations)
        if std_power > 0:
            z_score = abs(latest_power - avg_power) / std_power
            
            if z_score > 2.0:  # Significant deviation
                direction = "increase" if latest_power > avg_power else "decrease"
                return {
                    "change_type": "power_pattern_change",
                    "description": f"Power consumption {direction}d significantly "
                                  f"({avg_power:.1f} → {latest_power:.1f} kW, z-score: {z_score:.2f})",
                    "baseline_power": avg_power,
                    "current_power": latest_power,
                    "z_score": z_score,
                    "direction": direction,
                    "timestamp": latest_record.get("timestamp"),
                    "prediction": latest_record.get("raw_prediction")
                }
        
        return None
    
    def get_recent_predictions(self, count: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get recent prediction history.
        
        Args:
            count: Number of predictions to return (default: all)
            
        Returns:
            List of recent prediction records
        """
        predictions = list(self.prediction_history)
        if count is not None:
            return predictions[-count:] if count > 0 else []
        return predictions
    
    def reset_baselines(self):
        """Reset baseline values (useful after manual intervention)."""
        self.baseline_energy = None
        self.baseline_fines = None
        logger.info("Baselines reset")


# Global detector instances (one per device)
_detector_instances: Dict[str, MaterialChangeDetector] = {}


def get_detector(device_id: str = "crusher_01", **kwargs) -> MaterialChangeDetector:
    """
    Get or create detector instance for a device.
    
    Args:
        device_id: Device identifier
        **kwargs: Additional arguments for MaterialChangeDetector constructor
        
    Returns:
        MaterialChangeDetector instance
    """
    global _detector_instances
    
    if device_id not in _detector_instances:
        _detector_instances[device_id] = MaterialChangeDetector(**kwargs)
    
    return _detector_instances[device_id]

