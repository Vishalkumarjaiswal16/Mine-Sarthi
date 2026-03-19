import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Eye, EyeOff, Maximize2, Minimize2, Info } from 'lucide-react';

interface DigitalTwin3DFallbackProps {
  className?: string;
}

export const DigitalTwin3DFallback: React.FC<DigitalTwin3DFallbackProps> = ({ className }) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <Card className={`p-6 glass rounded-modern-xl shadow-depth-xl ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            3D Digital Twin (2D View)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Maximize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`relative bg-muted/20 rounded-lg overflow-hidden ${isFullscreen ? 'h-[600px]' : 'h-[500px]'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">3D Visualization Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                The 3D digital twin component is currently unavailable due to a compatibility issue with React Three Fiber.
                The 2D process visualization below provides the same functionality.
              </p>
              <div className="flex flex-col gap-2 items-center">
                <Info className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Scroll down to view the interactive 2D process visualization
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

