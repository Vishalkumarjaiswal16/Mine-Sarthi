"""
Model Loader Module

Loads and caches ML models from pickle files.
Provides safe loading, error handling, and in-memory caching.
"""

import os
import logging
import joblib
import sys
import types
from pathlib import Path
from typing import Optional, Tuple, Any
from functools import lru_cache

logger = logging.getLogger(__name__)

# Compatibility fix: Ensure sklearn is available for pickle loading
# Pickle files may reference 'sklearn' module which needs to be available
def _setup_sklearn_compatibility():
    """Set up sklearn module compatibility for pickle loading."""
    if 'sklearn' in sys.modules:
        return  # Already set up
    
    try:
        # Try to import sklearn directly (works in scikit-learn 1.0+)
        import sklearn
        sys.modules['sklearn'] = sklearn
        return
    except ImportError:
        pass
    
    # If direct import fails, try importing scikit-learn components
    try:
        import sklearn.ensemble
        import sklearn.preprocessing
        import sklearn.base
        import sklearn.tree
        import sklearn.utils
        
        # Create sklearn module structure
        sklearn_module = types.ModuleType('sklearn')
        sklearn_module.ensemble = sklearn.ensemble
        sklearn_module.preprocessing = sklearn.preprocessing
        sklearn_module.base = sklearn.base
        sklearn_module.tree = sklearn.tree
        sklearn_module.utils = sklearn.utils
        
        sys.modules['sklearn'] = sklearn_module
        logger.debug("Created sklearn compatibility module")
    except ImportError as e:
        logger.warning(f"Could not set up sklearn compatibility: {e}")

# Set up compatibility at module import time
_setup_sklearn_compatibility()

# Base directory for model files
BASE_DIR = Path(__file__).parent.parent
MODEL1_DIR = BASE_DIR / "models" / "model1"
MODEL2_DIR = BASE_DIR / "models" / "model2"

# Fallback paths (for development/testing)
FALLBACK_MODEL1_DIR = BASE_DIR.parent / "Model1 Output"
FALLBACK_MODEL2_DIR = BASE_DIR.parent / "Model2 Output"


class ModelLoader:
    """Handles loading and caching of ML models."""
    
    def __init__(self, model1_dir: Optional[str] = None, model2_dir: Optional[str] = None):
        """
        Initialize model loader with custom paths.
        
        Args:
            model1_dir: Path to Model 1 directory (ore hardness classifier)
            model2_dir: Path to Model 2 directory (RPM optimizer)
        """
        self.model1_dir = Path(model1_dir) if model1_dir else MODEL1_DIR
        self.model2_dir = Path(model2_dir) if model2_dir else MODEL2_DIR
        
        # Check if directories exist, use fallback if not
        if not self.model1_dir.exists():
            logger.warning(f"Model1 directory not found at {self.model1_dir}, trying fallback...")
            self.model1_dir = FALLBACK_MODEL1_DIR
            
        if not self.model2_dir.exists():
            logger.warning(f"Model2 directory not found at {self.model2_dir}, trying fallback...")
            self.model2_dir = FALLBACK_MODEL2_DIR
            
        # Cache for loaded models
        self._model1_cache = {}
        self._model2_cache = {}
        
    def get_model_path(self, model_dir: Path, filename: str) -> Path:
        """
        Resolve model file path.
        
        Args:
            model_dir: Directory containing model files
            filename: Name of the model file
            
        Returns:
            Path object to the model file
            
        Raises:
            FileNotFoundError: If model file doesn't exist
        """
        model_path = model_dir / filename
        
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {model_path}\n"
                f"Please ensure {filename} exists in {model_dir}"
            )
            
        return model_path
    
    def load_pickle(self, filepath: Path) -> Any:
        """
        Safely load a pickle file.
        
        Args:
            filepath: Path to pickle file
            
        Returns:
            Loaded object from pickle file
            
        Raises:
            Exception: If loading fails
        """
        try:
            logger.info(f"Loading model file: {filepath}")
            
            # Ensure sklearn is available before loading
            _setup_sklearn_compatibility()
            
            obj = joblib.load(filepath)
            logger.info(f"Successfully loaded: {filepath.name}")
            return obj
        except Exception as e:
            logger.error(f"Failed to load {filepath}: {str(e)}")
            # Try one more time with explicit sklearn setup
            if 'sklearn' not in str(e).lower():
                raise
            try:
                _setup_sklearn_compatibility()
                obj = joblib.load(filepath)
                logger.info(f"Successfully loaded {filepath.name} on retry")
                return obj
            except Exception as e2:
                logger.error(f"Failed to load {filepath} even after retry: {str(e2)}")
                raise
    
    def load_ore_classifier(self) -> Tuple[Any, Any, Any]:
        """
        Load Model 1 components (ore hardness classifier).
        
        Returns:
            Tuple of (classifier, scaler, label_encoder)
            
        Raises:
            FileNotFoundError: If any model file is missing
            Exception: If loading fails
        """
        cache_key = "ore_classifier"
        
        if cache_key in self._model1_cache:
            logger.debug("Using cached Model 1 components")
            return self._model1_cache[cache_key]
        
        try:
            # Load classifier
            classifier_path = self.get_model_path(
                self.model1_dir, 
                "ore_hardness_classifier_rf.pkl"
            )
            classifier = self.load_pickle(classifier_path)
            
            # Load scaler
            scaler_path = self.get_model_path(
                self.model1_dir,
                "scaler_ore_hardness.pkl"
            )
            scaler = self.load_pickle(scaler_path)
            
            # Load label encoder
            encoder_path = self.get_model_path(
                self.model1_dir,
                "label_encoder_ore_hardness.pkl"
            )
            encoder = self.load_pickle(encoder_path)
            
            result = (classifier, scaler, encoder)
            self._model1_cache[cache_key] = result
            
            logger.info("Model 1 (Ore Hardness Classifier) loaded successfully")
            return result
            
        except Exception as e:
            logger.error(f"Failed to load Model 1: {str(e)}")
            raise
    
    def load_rpm_optimizer(self) -> Tuple[Any, Any, Any]:
        """
        Load Model 2 components (RPM optimizer).
        
        Returns:
            Tuple of (regression_model, scaler, encoder)
            
        Raises:
            FileNotFoundError: If any model file is missing
            Exception: If loading fails
        """
        cache_key = "rpm_optimizer"
        
        if cache_key in self._model2_cache:
            logger.debug("Using cached Model 2 components")
            return self._model2_cache[cache_key]
        
        try:
            # Load regression model
            model_path = self.get_model_path(
                self.model2_dir,
                "energy_optimizer_model.pkl"
            )
            regression_model = self.load_pickle(model_path)
            
            # Load scaler
            scaler_path = self.get_model_path(
                self.model2_dir,
                "scaler_energy_features.pkl"
            )
            scaler = self.load_pickle(scaler_path)
            
            # Load encoder
            encoder_path = self.get_model_path(
                self.model2_dir,
                "encoder_ore_type_energy.pkl"
            )
            encoder = self.load_pickle(encoder_path)
            
            result = (regression_model, scaler, encoder)
            self._model2_cache[cache_key] = result
            
            logger.info("Model 2 (RPM Optimizer) loaded successfully")
            return result
            
        except Exception as e:
            logger.error(f"Failed to load Model 2: {str(e)}")
            raise


# Global model loader instance (lazy initialization)
_model_loader: Optional[ModelLoader] = None


def get_model_loader(model1_dir: Optional[str] = None, model2_dir: Optional[str] = None) -> ModelLoader:
    """
    Get or create global model loader instance.
    
    Args:
        model1_dir: Optional path to Model 1 directory
        model2_dir: Optional path to Model 2 directory
        
    Returns:
        ModelLoader instance
    """
    global _model_loader
    
    if _model_loader is None:
        _model_loader = ModelLoader(model1_dir=model1_dir, model2_dir=model2_dir)
    
    return _model_loader

