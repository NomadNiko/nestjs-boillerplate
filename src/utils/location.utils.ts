export interface GeoLocation {
    latitude: number;
    longitude: number;
  }
  
  export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  }
  
  /**
   * Calculates the distance between two points on Earth using the Haversine formula
   * @param lat1 Latitude of first point in degrees
   * @param lon1 Longitude of first point in degrees
   * @param lat2 Latitude of second point in degrees
   * @param lon2 Longitude of second point in degrees
   * @returns Distance in kilometers
   */
  export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Converts degrees to radians
   * @param degrees Angle in degrees
   * @returns Angle in radians
   */
  export function toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
  
  /**
   * Converts a GeoLocation object to a GeoPoint for MongoDB
   * @param location Location object with latitude and longitude
   * @returns GeoPoint object for MongoDB
   */
  export function toGeoPoint(location: GeoLocation): GeoPoint {
    return {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]
    };
  }
  
  /**
   * Converts a GeoPoint to a GeoLocation object
   * @param point GeoPoint object from MongoDB
   * @returns Location object with latitude and longitude
   */
  export function fromGeoPoint(point: GeoPoint): GeoLocation {
    return {
      latitude: point.coordinates[1],
      longitude: point.coordinates[0]
    };
  }
  
  /**
   * Validates if coordinates are within valid ranges
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @returns boolean indicating if coordinates are valid
   */
  export function isValidCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && 
           latitude <= 90 && 
           longitude >= -180 && 
           longitude <= 180;
  }
  
  /**
   * Calculates a bounding box for a given center point and radius
   * @param centerLat Center latitude in degrees
   * @param centerLon Center longitude in degrees
   * @param radiusKm Radius in kilometers
   * @returns Object with min/max lat/lon for the bounding box
   */
  export function calculateBoundingBox(centerLat: number, centerLon: number, radiusKm: number) {
    const R = 6371; // Earth's radius in kilometers
    
    // Angular radius in radians
    const angularRadius = radiusKm / R;
    
    const latMin = centerLat - (angularRadius * 180/Math.PI);
    const latMax = centerLat + (angularRadius * 180/Math.PI);
    
    // Adjust for longitude distance varying with latitude
    const latT = Math.abs(centerLat);
    const adjustment = Math.abs(Math.cos(latT * (Math.PI/180)));
    const lonMin = centerLon - (angularRadius * 180/Math.PI) / adjustment;
    const lonMax = centerLon + (angularRadius * 180/Math.PI) / adjustment;
    
    return {
      latMin: Math.max(-90, latMin),
      latMax: Math.min(90, latMax),
      lonMin: Math.max(-180, lonMin),
      lonMax: Math.min(180, lonMax)
    };
  }
  
  /**
   * Formats coordinates for display
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @param format Optional format ('DMS' for degrees/minutes/seconds or 'DD' for decimal degrees)
   * @returns Formatted coordinate string
   */
  export function formatCoordinates(
    latitude: number, 
    longitude: number, 
    format: 'DMS' | 'DD' = 'DD'
  ): string {
    if (format === 'DD') {
      return `${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`;
    }
    
    // Convert to degrees/minutes/seconds
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'E' : 'W';
    
    const formatDMS = (value: number): string => {
      const abs = Math.abs(value);
      const degrees = Math.floor(abs);
      const minutes = Math.floor((abs - degrees) * 60);
      const seconds = ((abs - degrees - minutes/60) * 3600).toFixed(1);
      return `${degrees}° ${minutes}' ${seconds}"`;
    };
    
    return `${formatDMS(latitude)}${latDir}, ${formatDMS(longitude)}${lonDir}`;
  }