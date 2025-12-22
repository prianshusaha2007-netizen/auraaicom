import { useState, useEffect, useCallback } from 'react';

export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: string;
  distanceMeters: number;
  rating: number;
  isOpen: boolean;
  address: string;
  icon: string;
  lat?: number;
  lng?: number;
}

export type PlaceCategory = 
  | 'cafe' 
  | 'restaurant' 
  | 'pharmacy' 
  | 'gas_station' 
  | 'atm' 
  | 'store'
  | 'hospital'
  | 'gym';

// Simulated places database - in production, would come from Google Places API
const placeTemplates: Record<PlaceCategory, { names: string[]; icon: string }> = {
  cafe: { 
    names: ['Starbucks', 'Cafe Coffee Day', 'Blue Tokai', 'Third Wave Coffee', 'Barista', 'Costa Coffee'],
    icon: '☕' 
  },
  restaurant: { 
    names: ['Domino\'s Pizza', 'McDonald\'s', 'KFC', 'Subway', 'Haldiram\'s', 'Barbeque Nation'],
    icon: '🍽️' 
  },
  pharmacy: { 
    names: ['Apollo Pharmacy', 'MedPlus', 'Netmeds Store', 'PharmEasy Store', '1mg Store'],
    icon: '💊' 
  },
  gas_station: { 
    names: ['Indian Oil', 'HP Petrol Pump', 'Bharat Petroleum', 'Shell', 'Reliance Petrol'],
    icon: '⛽' 
  },
  atm: { 
    names: ['HDFC ATM', 'ICICI ATM', 'SBI ATM', 'Axis ATM', 'Kotak ATM', 'PNB ATM'],
    icon: '🏧' 
  },
  store: { 
    names: ['Big Bazaar', 'D-Mart', 'Reliance Fresh', 'More Supermarket', 'Star Bazaar'],
    icon: '🏪' 
  },
  hospital: { 
    names: ['Apollo Hospital', 'Max Hospital', 'Fortis Hospital', 'AIIMS', 'Medanta'],
    icon: '🏥' 
  },
  gym: { 
    names: ['Gold\'s Gym', 'Cult.fit', 'Anytime Fitness', 'Snap Fitness', 'Talwalkars'],
    icon: '🏋️' 
  },
};

// Generate random distance based on category (some are typically closer)
const getRandomDistance = (category: PlaceCategory): number => {
  const baseRanges: Record<PlaceCategory, [number, number]> = {
    atm: [100, 800],
    pharmacy: [200, 1500],
    cafe: [300, 2000],
    restaurant: [200, 2500],
    store: [500, 3000],
    gas_station: [500, 3500],
    hospital: [1000, 5000],
    gym: [400, 3000],
  };
  
  const [min, max] = baseRanges[category];
  return Math.floor(Math.random() * (max - min) + min);
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

const generatePlacesForCategory = (
  category: PlaceCategory,
  userLat: number,
  userLng: number,
  count: number = 3
): NearbyPlace[] => {
  const template = placeTemplates[category];
  const shuffledNames = [...template.names].sort(() => Math.random() - 0.5);
  
  return shuffledNames.slice(0, count).map((name, index) => {
    const distanceMeters = getRandomDistance(category);
    // Generate random nearby coordinates
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;
    
    return {
      id: `${category}-${index}-${Date.now()}`,
      name,
      type: category,
      distance: formatDistance(distanceMeters),
      distanceMeters,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      isOpen: Math.random() > 0.2, // 80% chance of being open
      address: `${Math.floor(Math.random() * 500) + 1} ${['Main Road', 'Market Street', 'Station Road', 'Park Avenue', 'Ring Road'][Math.floor(Math.random() * 5)]}`,
      icon: template.icon,
      lat: userLat + latOffset,
      lng: userLng + lngOffset,
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
};

export const useNearbyPlaces = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError(error.message);
        setIsLoadingLocation(false);
        // Use default location (Delhi) for demo
        setLocation({ lat: 28.6139, lng: 77.2090 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const searchPlaces = useCallback((
    category?: PlaceCategory | null,
    query?: string
  ) => {
    if (!location) return;
    
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      let results: NearbyPlace[] = [];
      
      if (category) {
        results = generatePlacesForCategory(category, location.lat, location.lng, 5);
      } else if (query) {
        // Search across all categories
        const lowerQuery = query.toLowerCase();
        Object.keys(placeTemplates).forEach((cat) => {
          const catPlaces = generatePlacesForCategory(
            cat as PlaceCategory,
            location.lat,
            location.lng,
            2
          );
          results.push(...catPlaces.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.type.includes(lowerQuery)
          ));
        });
      } else {
        // Get all categories
        Object.keys(placeTemplates).forEach((cat) => {
          results.push(...generatePlacesForCategory(
            cat as PlaceCategory,
            location.lat,
            location.lng,
            2
          ));
        });
      }
      
      // Sort by distance
      results.sort((a, b) => a.distanceMeters - b.distanceMeters);
      setPlaces(results);
      setIsLoading(false);
    }, 500);
  }, [location]);

  // Initial load
  useEffect(() => {
    if (location) {
      searchPlaces();
    }
  }, [location, searchPlaces]);

  const openInMaps = useCallback((place: NearbyPlace) => {
    if (place.lat && place.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
        '_blank'
      );
    } else {
      const query = encodeURIComponent(`${place.name} ${place.address}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }, []);

  return {
    location,
    isLoadingLocation,
    locationError,
    places,
    isLoading,
    searchPlaces,
    openInMaps,
  };
};
