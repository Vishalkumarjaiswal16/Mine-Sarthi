import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Error Boundary specifically for route-level error handling
 * 
 * Wraps route components to catch and handle errors gracefully.
 * 
 * @example
 * ```tsx
 * <Route path="/dashboard" element={
 *   <ErrorBoundaryRoute>
 *     <Dashboard />
 *   </ErrorBoundaryRoute>
 * } />
 * ```
 */
interface ErrorBoundaryRouteProps {
  children: ReactNode;
  routeName?: string;
}

export function ErrorBoundaryRoute({ children, routeName }: ErrorBoundaryRouteProps): JSX.Element {
  const handleError = (error: Error, errorInfo: ErrorInfo): void => {
    // Log route-specific errors
    console.error(`Error in route: ${routeName || 'unknown'}`, error, errorInfo);
    
    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // Example: trackError({ route: routeName, error, errorInfo });
    }
  };

  return (
    <ErrorBoundary onError={handleError} resetOnPropsChange>
      {children}
    </ErrorBoundary>
  );
}

