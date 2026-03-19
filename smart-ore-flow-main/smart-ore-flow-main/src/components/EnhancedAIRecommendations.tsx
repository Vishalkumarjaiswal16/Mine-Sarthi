import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingDown, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ArrowRight,
  Target,
  DollarSign
} from 'lucide-react';
import { type AIRecommendation } from '@/lib/mockData';

interface EnhancedAIRecommendationsProps {
  recommendations: AIRecommendation[];
  onApply?: (recommendationId: string) => void;
}

export const EnhancedAIRecommendations: React.FC<EnhancedAIRecommendationsProps> = ({
  recommendations,
  onApply,
}) => {
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());
  const [simulatedEffects, setSimulatedEffects] = useState<Map<string, { energySavings?: number; efficiencyGain?: number; impact?: string; costSavings?: number }>>(new Map());

  const handleApply = (recommendation: AIRecommendation) => {
    if (appliedRecommendations.has(recommendation.id)) return;
    
    setAppliedRecommendations(prev => new Set(prev).add(recommendation.id));
    
    // Simulate effect
    const simulatedEffect = {
      energySavings: recommendation.energySavings || 0,
      costSavings: (recommendation.energySavings || 0) * 0.12, // $0.12 per kWh
      efficiencyGain: recommendation.efficiencyGain || 0,
    };
    setSimulatedEffects(prev => new Map(prev).set(recommendation.id, simulatedEffect));
    
    onApply?.(recommendation.id);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success border-success/30 bg-success/10';
    if (confidence >= 60) return 'text-warning border-warning/30 bg-warning/10';
    return 'text-muted-foreground border-muted/30 bg-muted/10';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Optimization Recommendations
          <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-primary/30">
            {recommendations.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => {
          const isApplied = appliedRecommendations.has(rec.id);
          const simulatedEffect = simulatedEffects.get(rec.id);
          
          return (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                isApplied
                  ? 'border-success/50 bg-success/5'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{rec.title}</h4>
                    {getPriorityBadge(rec.priority || 'medium')}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                </div>
                {isApplied && (
                  <Badge variant="outline" className="border-success text-success bg-success/10">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Applied
                  </Badge>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {rec.energySavings !== undefined && (
                  <div className="p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-warning" />
                      <span className="text-xs text-muted-foreground">Energy Savings</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {rec.energySavings > 0 ? '+' : ''}{rec.energySavings.toFixed(1)}%
                    </div>
                    {simulatedEffect && (
                      <div className="text-xs text-success mt-1">
                        ≈ {(rec.energySavings * 1000).toFixed(0)} kWh/day
                      </div>
                    )}
                  </div>
                )}
                
                {rec.efficiencyGain !== undefined && (
                  <div className="p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-3 h-3 text-success" />
                      <span className="text-xs text-muted-foreground">Efficiency</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {rec.efficiencyGain > 0 ? '+' : ''}{rec.efficiencyGain.toFixed(1)}%
                    </div>
                  </div>
                )}
                
                {simulatedEffect && (
                  <div className="p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-success" />
                      <span className="text-xs text-muted-foreground">Cost Savings</span>
                    </div>
                    <div className="text-lg font-bold text-success">
                      ${(simulatedEffect.costSavings ?? 0).toFixed(0)}/day
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Score */}
              {rec.confidence !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Confidence Score
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getConfidenceColor(rec.confidence)}`}>
                      {rec.confidence}%
                    </span>
                  </div>
                  <Progress value={rec.confidence} className="h-1.5" />
                </div>
              )}

              {/* Expected Impact */}
              {rec.expectedImpact && (
                <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      Expected Impact: {rec.expectedImpact}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!isApplied && (
                <Button
                  onClick={() => handleApply(rec)}
                  className="w-full mt-2"
                  variant="default"
                >
                  Apply Recommendation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {/* Applied State */}
              {isApplied && simulatedEffect && (
                <div className="mt-2 p-3 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm font-semibold text-success">Recommendation Applied</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Simulated effect: {(simulatedEffect.energySavings ?? 0).toFixed(1)}% energy reduction, 
                    ${(simulatedEffect.costSavings ?? 0).toFixed(0)}/day savings
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {recommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations available at this time</p>
            <p className="text-xs mt-2">All systems are operating optimally</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

