import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TimeSliderProps {
  startDate: Date;
  endDate: Date;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  startDate,
  endDate,
  currentDate,
  onDateChange,
  onPlay,
  onPause,
  isPlaying = false,
  playbackSpeed = 1,
  onSpeedChange,
}) => {
  const [localDate, setLocalDate] = useState(currentDate);
  const [isLocalPlaying, setIsLocalPlaying] = useState(isPlaying);

  const totalDuration = endDate.getTime() - startDate.getTime();
  const currentPosition = currentDate.getTime() - startDate.getTime();
  const percentage = (currentPosition / totalDuration) * 100;

  useEffect(() => {
    setLocalDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    setIsLocalPlaying(isPlaying);
  }, [isPlaying]);

  const handleSliderChange = (value: number[]) => {
    const newDate = new Date(startDate.getTime() + (value[0] / 100) * totalDuration);
    setLocalDate(newDate);
    onDateChange(newDate);
  };

  const handlePlayPause = () => {
    if (isLocalPlaying) {
      setIsLocalPlaying(false);
      onPause?.();
    } else {
      setIsLocalPlaying(true);
      onPlay?.();
    }
  };

  const handleStep = (direction: 'back' | 'forward', steps: number = 1) => {
    const stepDuration = totalDuration / 100; // 1% step
    const newDate = new Date(
      localDate.getTime() + (direction === 'forward' ? 1 : -1) * stepDuration * steps
    );
    const clampedDate = new Date(
      Math.max(startDate.getTime(), Math.min(endDate.getTime(), newDate.getTime()))
    );
    setLocalDate(clampedDate);
    onDateChange(clampedDate);
  };

  const speeds = [0.5, 1, 2, 4, 8];

  return (
    <Card className="p-4 glass rounded-modern-xl shadow-depth-xl">
      <CardContent className="p-0 space-y-4">
        {/* Date Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(localDate, 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[percentage]}
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{format(startDate, 'MMM dd')}</span>
            <span>{format(endDate, 'MMM dd')}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStep('back', 10)}
              className="h-8 w-8 p-0"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStep('back')}
              className="h-8 w-8 p-0"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePlayPause}
              className="h-8 w-8 p-0"
            >
              {isLocalPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStep('forward')}
              className="h-8 w-8 p-0"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStep('forward', 10)}
              className="h-8 w-8 p-0"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed Control */}
          {onSpeedChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speed:</span>
              <div className="flex gap-1">
                {speeds.map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSpeedChange(speed)}
                    className="h-6 px-2 text-xs"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

