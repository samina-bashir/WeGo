export const setRideDetails = (details) => ({
    type: 'SET_RIDE_DETAILS',
    payload: details,
  });
  
  export const setLoading = (isLoading) => ({
    type: 'SET_LOADING',
    payload: isLoading,
  });
  
  export const setDistance = (distance) => ({
    type: 'SET_DISTANCE',
    payload: distance,
  });
  
  export const setDuration = (duration) => ({
    type: 'SET_DURATION',
    payload: duration,
  });
  
  export const setFromLocation = (location) => ({
    type: 'SET_FROM_LOCATION',
    payload: location,
  });
  
  export const setToLocation = (location) => ({
    type: 'SET_TO_LOCATION',
    payload: location,
  });
  
  export const setFromRideLocation = (location) => ({
    type: 'SET_FROM_RIDE_LOCATION',
    payload: location,
  });
  
  export const setToRideLocation = (location) => ({
    type: 'SET_TO_RIDE_LOCATION',
    payload: location,
  });
  
  export const setFare = (fare) => ({
    type: 'SET_FARE',
    payload: fare,
  });
  
  export const setDriverInfo = (info) => ({
    type: 'SET_DRIVER_INFO',
    payload: info,
  });
  
  export const setCoriders = (coriders) => ({
    type: 'SET_CORIDERS',
    payload: coriders,
  });
  
  export const setWayPoints = (wayPoints) => ({
    type: 'SET_WAYPOINTS',
    payload: wayPoints,
  });

  export const setConfirmedWayPoints = (wayPoints) => ({
    type: 'SET_CONFIRMED_WAYPOINTS',
    payload: wayPoints,
  });
  
  export const setLocation = (location) => ({
    type: 'SET_LOCATION',
    payload: location,
  });
  // Add other action creators if needed
  