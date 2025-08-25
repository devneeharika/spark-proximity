import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface LocationState {
  location: GeolocationData | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export const useGeolocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    permissionStatus: 'unknown',
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const checkPermission = async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported', permissionStatus: 'denied' }));
      return 'denied';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setState(prev => ({ ...prev, permissionStatus: permission.state as any }));
      return permission.state;
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      return 'unknown';
    }
  };

  const getCurrentLocation = async (options?: PositionOptions): Promise<GeolocationData | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        setState(prev => ({ ...prev, loading: false, error: 'Location request timed out' }));
        resolve(null);
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const locationData: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          
          setState(prev => ({ 
            ...prev, 
            location: locationData, 
            loading: false, 
            error: null,
            permissionStatus: 'granted'
          }));
          
          resolve(locationData);
        },
        (error) => {
          clearTimeout(timeoutId);
          let errorMessage = 'Failed to get location';
          let permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied';
              permissionStatus = 'denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: errorMessage,
            permissionStatus
          }));
          
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
          ...options,
        }
      );
    });
  };

  const saveLocationToDatabase = async (locationData?: GeolocationData) => {
    if (!user || (!locationData && !state.location)) return false;

    const location = locationData || state.location!;

    try {
      // Use reverse geocoding to get location name (optional)
      let locationName = '';
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
        );
        const data = await response.json();
        locationName = `${data.city || data.locality || ''}, ${data.countryName || ''}`.replace(/^,\s*/, '');
      } catch (geocodeError) {
        console.warn('Failed to get location name:', geocodeError);
      }

      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: locationName || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Location updated",
        description: "Your location has been saved successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Failed to save location",
        description: "Could not update your location. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const requestLocationAndSave = async () => {
    const location = await getCurrentLocation();
    if (location) {
      await saveLocationToDatabase(location);
    }
    return location;
  };

  const clearLocation = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setState(prev => ({ ...prev, location: null }));
      
      toast({
        title: "Location cleared",
        description: "Your location has been removed.",
      });

      return true;
    } catch (error) {
      console.error('Error clearing location:', error);
      toast({
        title: "Failed to clear location",
        description: "Could not remove your location. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    ...state,
    getCurrentLocation,
    saveLocationToDatabase,
    requestLocationAndSave,
    clearLocation,
    checkPermission,
  };
};