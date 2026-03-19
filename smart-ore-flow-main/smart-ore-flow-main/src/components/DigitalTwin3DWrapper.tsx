import React from 'react';
import { DigitalTwin3DFallback } from './DigitalTwin3DFallback';

// Use fallback component for now since React Three Fiber has initialization issues
// This prevents the page from crashing
export const DigitalTwin3DWrapper: React.FC<{ className?: string }> = ({ className }) => {
  // Temporarily use fallback until React Three Fiber issue is resolved
  return <DigitalTwin3DFallback className={className} />;
  
  // Original code commented out due to React Three Fiber initialization error
  // Uncomment when the issue is resolved:
  /*
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    
    // Dynamically import the component
    import('@/components/DigitalTwin3D')
      .then((module) => {
        if (mounted) {
          setComponent(() => module.DigitalTwin3D);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load DigitalTwin3D:', err);
        if (mounted) {
          setError(err.message || 'Failed to load 3D component');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <DigitalTwin3DFallback className={className} />;
  }

  if (error || !Component) {
    return <DigitalTwin3DFallback className={className} />;
  }

  return <Component className={className} />;
  */
};

