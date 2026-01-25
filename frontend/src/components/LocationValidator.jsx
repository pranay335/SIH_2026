import { useState, useEffect, useRef } from 'react';

const LocationValidator = ({ 
  onLocationValidated, 
  complaintCategory, 
  onLocationUpdate,
  className = '' 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userMarker, setMarker] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [locationPermission, setLocationPermission] = useState('prompt');

  // Google Maps API key (should be in environment variables)
  const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (map) {
        // Cleanup map resources
        if (userMarker) {
          userMarker.setMap(null);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (map && userLocation) {
      updateUserMarker();
      validateUserLocation();
    }
  }, [userLocation, map, complaintCategory]);

  const initializeMap = () => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
      zoom: 13,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }]
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242f3e" }]
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }]
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }]
        }
      ]
    });

    setMap(mapInstance);
    loadSectors(mapInstance);
  };

  const loadSectors = async (mapInstance) => {
    try {
      const response = await fetch('http://localhost:5000/api/sectors');
      const sectorsData = await response.json();
      setSectors(sectorsData);

      // Draw sector boundaries on map
      sectorsData.forEach(sector => {
        const coordinates = sector.boundaries.coordinates[0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));

        const polygon = new window.google.maps.Polygon({
          paths: coordinates,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          map: mapInstance
        });

        // Add click listener for sector info
        window.google.maps.event.addListener(polygon, 'click', () => {
          showSectorInfo(sector);
        });
      });
    } catch (err) {
      console.error('Failed to load sectors:', err);
      setError('Failed to load sector boundaries');
    }
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);
        setLocationPermission('granted');
        setIsLoading(false);
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }

        // Center map on user location
        if (map) {
          map.setCenter(location);
          map.setZoom(15);
        }
      },
      (error) => {
        handleLocationError(error);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleLocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationPermission('denied');
        setError('Location permission denied. Please enable location access to file complaints.');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        setError('Location request timed out.');
        break;
      default:
        setError('An unknown error occurred while retrieving location.');
        break;
    }
  };

  const updateUserMarker = () => {
    if (userMarker) {
      userMarker.setMap(null);
    }

    const marker = new window.google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: isValid ? '#10B981' : '#EF4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    setMarker(marker);
  };

  const validateUserLocation = async () => {
    if (!userLocation) return;

    try {
      const response = await fetch('http://localhost:5000/api/sectors/validate-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          complaint_category: complaintCategory
        })
      });

      const result = await response.json();
      
      setIsValid(result.isValid);
      setValidationMessage(result.message);
      
      if (onLocationValidated) {
        onLocationValidated({
          isValid: result.isValid,
          message: result.message,
          sectors: result.sectors,
          location: userLocation
        });
      }

      // Update marker color based on validation
      if (userMarker) {
        userMarker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: result.isValid ? '#10B981' : '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        });
      }
    } catch (err) {
      console.error('Location validation failed:', err);
      setError('Failed to validate location');
      setIsValid(false);
    }
  };

  const showSectorInfo = (sector) => {
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; color: #333;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${sector.name}</h3>
          <p style="margin: 5px 0;"><strong>Sector ID:</strong> ${sector.sector_id}</p>
          <p style="margin: 5px 0;"><strong>Ward:</strong> ${sector.ward_number}</p>
          <p style="margin: 5px 0;"><strong>Zone:</strong> ${sector.zone}</p>
          <p style="margin: 5px 0;"><strong>Categories:</strong> ${sector.complaint_categories.join(', ')}</p>
        </div>
      `
    });

    infoWindow.setPosition({
      lat: sector.center[1],
      lng: sector.center[0]
    });
    infoWindow.open(map);
  };

  const requestLocationPermission = () => {
    getCurrentLocation();
  };

  return (
    <div className={`location-validator ${className}`}>
      {/* Location Permission Status */}
      <div className="mb-4 p-4 rounded-lg border ${
        isValid === true ? 'bg-green-500/10 border-green-500/30' :
        isValid === false ? 'bg-red-500/10 border-red-500/30' :
        'bg-gray-500/10 border-gray-500/30'
      }">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isValid === true ? 'bg-green-400' :
              isValid === false ? 'bg-red-400' :
              'bg-gray-400'
            }`}></div>
            <div>
              <p className="text-white font-medium text-sm">
                {isValid === true ? '🟢 Inside Sector – Complaint Allowed' :
                 isValid === false ? '🔴 Outside Sector – Submission Blocked' :
                 '⚪ Location Not Detected'}
              </p>
              {validationMessage && (
                <p className="text-white/70 text-xs mt-1">{validationMessage}</p>
              )}
            </div>
          </div>
          
          {locationPermission === 'denied' && (
            <button
              onClick={requestLocationPermission}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Enable Location
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96 rounded-lg border border-white/10"
          style={{ backgroundColor: '#1f2937' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-white text-sm">Getting your location...</p>
            </div>
          </div>
        )}

        {!userLocation && !isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg className="w-12 h-12 text-white/60 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-white/80 mb-3">Location access required</p>
              <button
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Get My Location
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location Info */}
      {userLocation && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-white/70 text-xs">
            <strong>Current Location:</strong> {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationValidator;
