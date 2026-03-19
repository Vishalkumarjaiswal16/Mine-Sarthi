import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bookmark, BookmarkCheck, Trash2, Save, X } from 'lucide-react';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string | boolean>;
  createdAt: Date;
}

export interface FilterPresetsProps {
  presets: FilterPreset[];
  currentFilters: Record<string, string | boolean>;
  onLoadPreset: (filters: Record<string, string | boolean>) => void;
  onSavePreset: (name: string, filters: Record<string, string | boolean>) => void;
  onDeletePreset: (id: string) => void;
  className?: string;
}

const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  currentFilters,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const hasActiveFilters = Object.values(currentFilters).some(value =>
    value !== '' && value !== false && value !== undefined && value !== null
  );

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), currentFilters);
      setPresetName('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset.filters);
    setIsOpen(false);
  };

  const formatFilterSummary = (filters: Record<string, string | boolean>) => {
    const activeFilters = Object.entries(filters).filter(([key, value]) =>
      value !== '' && value !== false && value !== undefined && value !== null
    );

    if (activeFilters.length === 0) return 'No filters';

    return activeFilters
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ') + (activeFilters.length > 2 ? '...' : '');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4 mr-2" />
            Presets
            {presets.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {presets.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 border-b">
            <h4 className="font-medium">Filter Presets</h4>
            <p className="text-sm text-muted-foreground">Save and load filter configurations</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {presets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved presets</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer group"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm truncate">{preset.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFilterSummary(preset.filters)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {preset.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePreset(preset.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!hasActiveFilters}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Current Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Filter Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Preset Name</label>
                    <Input
                      placeholder="Enter preset name..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSavePreset();
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Current Filters:</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFilterSummary(currentFilters)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSaveDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                    >
                      Save Preset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Badge variant="outline" className="text-xs">
          Filters active
        </Badge>
      )}
    </div>
  );
};

export default FilterPresets;
