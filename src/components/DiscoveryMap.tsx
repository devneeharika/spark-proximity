import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Settings } from 'lucide-react';

interface DiscoveryMapProps {
  userLocation?: { latitude: number; longitude: number } | null;
  matches?: any[];
  className?: string;
}

const DiscoveryMap = ({ userLocation, matches = [], className }: DiscoveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      mapboxgl.accessToken = token;
      
      // Default center (San Francisco)
      const center: [number, number] = userLocation 
        ? [userLocation.longitude, userLocation.latitude]
        : [-122.4194, 37.7749];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center,
        zoom: userLocation ? 12 : 10,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add user location marker if available
      if (userLocation) {
        new mapboxgl.Marker({ color: '#8b5cf6' })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .setPopup(new mapboxgl.Popup().setHTML('<p><strong>Your Location</strong></p>'))
          .addTo(map.current);

        // Add radius circle for discovery area
        map.current.on('load', () => {
          if (!map.current || !userLocation) return;

          map.current.addSource('discovery-radius', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [userLocation.longitude, userLocation.latitude]
              },
              properties: {}
            }
          });

          map.current.addLayer({
            id: 'discovery-radius',
            type: 'circle',
            source: 'discovery-radius',
            paint: {
              'circle-radius': {
                stops: [
                  [0, 0],
                  [20, 500]
                ],
                base: 2
              },
              'circle-color': '#8b5cf6',
              'circle-opacity': 0.1,
              'circle-stroke-color': '#8b5cf6',
              'circle-stroke-width': 2,
              'circle-stroke-opacity': 0.3
            }
          });
        });
      }

      // Add markers for potential matches
      matches.forEach((match, index) => {
        if (match.latitude && match.longitude) {
          new mapboxgl.Marker({ color: '#22c55e' })
            .setLngLat([match.longitude, match.latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                <div>
                  <strong>${match.display_name}</strong>
                  <p>${match.shared_interests_count} shared interests</p>
                </div>
              `)
            )
            .addTo(map.current);
        }
      });

      setInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken);
      initializeMap(mapboxToken);
      setShowTokenInput(false);
    }
  };

  useEffect(() => {
    // Use the provided public token directly
    const publicToken = 'pk.eyJ1IjoibmVlaGFyaWthdmFuZ2F2YXJhZ3UiLCJhIjoiY21lcWwyYTV5MGNqMzJrcHVla2MzOGExdCJ9.-7KDyeW2oTl4b09PgTmIOQ';
    setMapboxToken(publicToken);
    initializeMap(publicToken);

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (initialized && map.current && userLocation) {
      // Update map center when user location changes
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 12
      });
    }
  }, [userLocation, initialized]);

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapbox Token Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To show the discovery map, please enter your Mapbox public token.
            </p>
            <p className="text-xs text-muted-foreground">
              Get your free token at{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
              />
              <Button onClick={handleTokenSubmit} size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-64 rounded-lg shadow-lg" />
      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span>You</span>
        </div>
        {matches.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Matches</span>
          </div>
        )}
      </div>
      {!userLocation && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Enable location to see the discovery map</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryMap;