import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Search, Star, Clock, X } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface Region {
  id: string;
  name: string;
  locations: Location[];
}

interface State {
  id: string;
  name: string;
  regions: Region[];
}

interface Country {
  id: string;
  name: string;
  states: State[];
}

const mockLocationData: Country[] = [
  {
    id: "india",
    name: "India",
    states: [
      {
        id: "odisha",
        name: "Odisha",
        regions: [
          {
            id: "joda-barbil",
            name: "Joda-Barbil Mining Belt",
            locations: [
              { id: "joda", name: "Joda Iron Ore Mine", lat: 22.0300, lng: 85.4300, timezone: "IST" },
              { id: "barbil", name: "Barbil Mining Complex", lat: 22.1000, lng: 85.3500, timezone: "IST" },
              { id: "koira", name: "Koira Mining Zone", lat: 22.0500, lng: 85.4000, timezone: "IST" },
            ]
          },
          {
            id: "sundargarh",
            name: "Sundargarh District",
            locations: [
              { id: "raurkela", name: "Rourkela Steel Plant", lat: 22.2600, lng: 84.8500, timezone: "IST" },
              { id: "bonai", name: "Bonai Mining Area", lat: 22.1500, lng: 84.9000, timezone: "IST" },
            ]
          }
        ]
      },
      {
        id: "jharkhand",
        name: "Jharkhand",
        regions: [
          {
            id: "singhbhum",
            name: "Singhbhum Mining Region",
            locations: [
              { id: "jamshedpur", name: "Jamshedpur Iron & Steel", lat: 22.8000, lng: 86.1833, timezone: "IST" },
              { id: "chaibasa", name: "Chaibasa Mining District", lat: 22.5500, lng: 85.8000, timezone: "IST" },
              { id: "noamundi", name: "Noamundi Iron Ore Mine", lat: 22.1500, lng: 85.5000, timezone: "IST" },
            ]
          },
          {
            id: "dhanbad",
            name: "Dhanbad Coal Belt",
            locations: [
              { id: "dhanbad", name: "Dhanbad Coal Mines", lat: 23.8000, lng: 86.4500, timezone: "IST" },
              { id: "bokaro", name: "Bokaro Steel Plant", lat: 23.6700, lng: 85.9800, timezone: "IST" },
            ]
          }
        ]
      },
      {
        id: "chhattisgarh",
        name: "Chhattisgarh",
        regions: [
          {
            id: "durg-bhilai",
            name: "Durg-Bhilai Region",
            locations: [
              { id: "bhilai", name: "Bhilai Steel Plant", lat: 21.2000, lng: 81.4000, timezone: "IST" },
              { id: "raipur", name: "Raipur Mining Hub", lat: 21.2500, lng: 81.6300, timezone: "IST" },
            ]
          },
          {
            id: "raigarh",
            name: "Raigarh District",
            locations: [
              { id: "raigarh", name: "Raigarh Coal Mines", lat: 21.9000, lng: 83.4000, timezone: "IST" },
            ]
          }
        ]
      },
      {
        id: "karnataka",
        name: "Karnataka",
        regions: [
          {
            id: "bellary",
            name: "Bellary Mining District",
            locations: [
              { id: "bellary", name: "Bellary Iron Ore Mines", lat: 15.1500, lng: 76.9333, timezone: "IST" },
              { id: "hospet", name: "Hospet Mining Complex", lat: 15.2700, lng: 76.4000, timezone: "IST" },
            ]
          }
        ]
      },
      {
        id: "goa",
        name: "Goa",
        regions: [
          {
            id: "south-goa",
            name: "South Goa Mining Zone",
            locations: [
              { id: "margao", name: "Margao Mining Area", lat: 15.3000, lng: 73.9500, timezone: "IST" },
            ]
          }
        ]
      },
      {
        id: "rajasthan",
        name: "Rajasthan",
        regions: [
          {
            id: "udaipur",
            name: "Udaipur Mining Region",
            locations: [
              { id: "udaipur", name: "Udaipur Zinc-Lead Mines", lat: 24.5800, lng: 73.6800, timezone: "IST" },
              { id: "zawar", name: "Zawar Mining Complex", lat: 24.3500, lng: 73.7000, timezone: "IST" },
            ]
          },
          {
            id: "ajmer",
            name: "Ajmer District",
            locations: [
              { id: "khetri", name: "Khetri Copper Mines", lat: 28.0000, lng: 75.8000, timezone: "IST" },
            ]
          }
        ]
      }
    ]
  },
  {
    id: "us",
    name: "United States",
    states: [
      {
        id: "california",
        name: "California",
        regions: [
          {
            id: "northern-ca",
            name: "Northern California",
            locations: [
              { id: "san-francisco", name: "San Francisco Mining Zone", lat: 37.7749, lng: -122.4194, timezone: "PST" },
            ]
          }
        ]
      }
    ]
  },
  {
    id: "australia",
    name: "Australia",
    states: [
      {
        id: "western-australia",
        name: "Western Australia",
        regions: [
          {
            id: "pilbara",
            name: "Pilbara Region",
            locations: [
              { id: "newman", name: "Newman Mining Complex", lat: -23.3539, lng: 119.7528, timezone: "AWST" },
            ]
          }
        ]
      }
    ]
  }
];

interface LocationSelectorProps {
  onLocationSelect: (location: Location | null) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationSelect }) => {
  // Default to India
  const [selectedCountry, setSelectedCountry] = useState<string | null>("india");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<Location[]>(() => {
    const saved = localStorage.getItem('weather-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentLocations, setRecentLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('weather-recent');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    onLocationSelect(selectedLocation);
  }, [selectedLocation, onLocationSelect]);

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedState(null);
    setSelectedRegion(null);
    setSelectedLocation(null);
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedRegion(null);
    setSelectedLocation(null);
  };

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedLocation(null);
  };

  const handleLocationChange = (locationId: string) => {
    const country = mockLocationData.find(c => c.id === selectedCountry);
    const state = country?.states.find(s => s.id === selectedState);
    const region = state?.regions.find(r => r.id === selectedRegion);
    const location = region?.locations.find(l => l.id === locationId);
    if (location) {
      setSelectedLocation(location);
      // Add to recent locations
      const updatedRecent = [location, ...recentLocations.filter(l => l.id !== location.id)].slice(0, 5);
      setRecentLocations(updatedRecent);
      localStorage.setItem('weather-recent', JSON.stringify(updatedRecent));
    }
  };

  const toggleFavorite = (location: Location) => {
    const isFavorite = favorites.some(f => f.id === location.id);
    let updatedFavorites: Location[];
    if (isFavorite) {
      updatedFavorites = favorites.filter(f => f.id !== location.id);
    } else {
      updatedFavorites = [location, ...favorites].slice(0, 10);
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('weather-favorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (location: Location) => {
    return favorites.some(f => f.id === location.id);
  };

  // Search functionality
  const searchLocations = (query: string): Location[] => {
    if (!query.trim()) return [];
    const queryLower = query.toLowerCase();
    const results: Location[] = [];
    
    mockLocationData.forEach(country => {
      country.states.forEach(state => {
        state.regions.forEach(region => {
          region.locations.forEach(location => {
            if (
              location.name.toLowerCase().includes(queryLower) ||
              region.name.toLowerCase().includes(queryLower) ||
              state.name.toLowerCase().includes(queryLower) ||
              country.name.toLowerCase().includes(queryLower)
            ) {
              results.push(location);
            }
          });
        });
      });
    });
    
    return results.slice(0, 10); // Limit to 10 results
  };

  const searchResults = searchQuery ? searchLocations(searchQuery) : [];

  const selectedCountryData = mockLocationData.find(c => c.id === selectedCountry);
  const selectedStateData = selectedCountryData?.states.find(s => s.id === selectedState);
  const selectedRegionData = selectedStateData?.regions.find(r => r.id === selectedRegion);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Location Selector</h3>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
          <Label className="text-xs text-muted-foreground font-semibold">Search Results</Label>
          {searchResults.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all"
              onClick={() => {
                setSelectedLocation(location);
                onLocationSelect(location);
                setSearchQuery('');
              }}
            >
              <div className="flex items-center gap-2 flex-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-sm">{location.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(location);
                }}
              >
                <Star className={`w-3 h-3 ${isFavorite(location) ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No locations found. Try a different search term.
        </div>
      )}

      {/* Favorites - Always visible when not searching */}
      {!searchQuery && favorites.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            <Star className="w-3 h-3 text-warning" />
            Favorites
          </Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {favorites.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all"
                onClick={() => {
                  setSelectedLocation(location);
                  onLocationSelect(location);
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-sm">{location.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(location);
                  }}
                >
                  <Star className="w-3 h-3 fill-warning text-warning" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Locations - Always visible when not searching */}
      {!searchQuery && recentLocations.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            Recent
          </Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentLocations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all"
                onClick={() => {
                  setSelectedLocation(location);
                  onLocationSelect(location);
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-sm">{location.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(location);
                  }}
                >
                  <Star className={`w-3 h-3 ${isFavorite(location) ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Level Dropdowns - ALWAYS VISIBLE */}
      <div className="border-t border-border/50 pt-4 mt-4">
        <div className="mb-4 p-3 bg-primary/10 border-2 border-primary/30 rounded-lg shadow-lg">
          <Label className="text-base font-bold text-primary flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5" />
            Multi-Level Location Selection
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Use the dropdowns below to select: <strong>Country → State → Region → Location</strong>
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Step 1: Country */}
          <div>
            <Label htmlFor="country-select" className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-primary" />
              Step 1: Select Country
            </Label>
            <Select value={selectedCountry || ""} onValueChange={handleCountryChange}>
              <SelectTrigger id="country-select" className="w-full h-10">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {mockLocationData.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: State */}
          <div>
            <Label htmlFor="state-select" className="text-sm font-semibold flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Step 2: Select State/Region
            </Label>
            <Select
              value={selectedState || ""}
              onValueChange={handleStateChange}
              disabled={!selectedCountry}
            >
              <SelectTrigger id="state-select" className="w-full h-10">
                <SelectValue placeholder={selectedCountry ? "Select a state/region" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                {selectedCountryData?.states.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Region */}
          <div>
            <Label htmlFor="region-select" className="text-sm font-semibold flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Step 3: Select District/Mining Zone
            </Label>
            <Select
              value={selectedRegion || ""}
              onValueChange={handleRegionChange}
              disabled={!selectedState}
            >
              <SelectTrigger id="region-select" className="w-full h-10">
                <SelectValue placeholder={selectedState ? "Select a district/zone" : "Select state first"} />
              </SelectTrigger>
              <SelectContent>
                {selectedStateData?.regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 4: Location */}
          <div>
            <Label htmlFor="location-select" className="text-sm font-semibold flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Step 4: Select Specific Location
            </Label>
            <Select
              value={selectedLocation?.id || ""}
              onValueChange={handleLocationChange}
              disabled={!selectedRegion}
            >
              <SelectTrigger id="location-select" className="w-full h-10">
                <SelectValue placeholder={selectedRegion ? "Select a specific location" : "Select region first"} />
              </SelectTrigger>
              <SelectContent>
                {selectedRegionData?.locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {location.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="mt-4 p-4 bg-primary/10 border-2 border-primary/30 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">Selected: {selectedLocation.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleFavorite(selectedLocation)}
                >
                  <Star className={`w-4 h-4 ${isFavorite(selectedLocation) ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)} • Timezone: {selectedLocation.timezone}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
