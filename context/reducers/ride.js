const initialState = {
    rideDetails: null,
    isLoading: false,
    distance: 10,
    duration: 70,
    fromLocation: null,
    toLocation: null,
    fromRideLocation: null,
    toRideLocation: null,
    fare: null,
    driverInfo: null,
    coriders: [],
    wayPoints: [],
    confirmedWayPoints: [],
    location: null,
    cancelledRiders: [],
    cancelledByMe: false,
    rideEnded: false,
    showDirections: false
    // Add other ride-related state properties if needed
};

const rideReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_RIDE_DETAILS':
            return {
                ...state,
                rideDetails: action.payload,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        case 'SET_DISTANCE':
            return {
                ...state,
                distance: action.payload,
            };
        case 'SET_DURATION':
            return {
                ...state,
                duration: action.payload,
            };
        case 'SET_FROM_LOCATION':
            return {
                ...state,
                fromLocation: action.payload,
            };
        case 'SET_TO_LOCATION':
            return {
                ...state,
                toLocation: action.payload,
            };
        case 'SET_FROM_RIDE_LOCATION':
            return {
                ...state,
                fromRideLocation: action.payload,
            };
        case 'SET_TO_RIDE_LOCATION':
            return {
                ...state,
                toRideLocation: action.payload,
            };
        case 'SET_FARE':
            return {
                ...state,
                fare: action.payload,
            };
        case 'SET_DRIVER_INFO':
            return {
                ...state,
                driverInfo: action.payload,
            };
        case 'SET_CORIDERS':
            return {
                ...state,
                coriders: action.payload,
            };
        case 'SET_WAYPOINTS':
            return {
                ...state,
                wayPoints: action.payload,
            };
        case 'SET_CONFIRMED_WAYPOINTS':
            return {
                ...state,
                confirmedWayPoints: action.payload,
            };
        case 'SET_CANCELLED_BY_ME':
            return {
                ...state,
                cancelledByMe: action.payload,
            };
        case 'SET_CANCELLED_RIDERS':
            return {
                ...state,
                cancelledRiders: action.payload,
            };
        case 'SET_LOCATION':
            return {
                ...state,
                location: action.payload,
            };
        case 'SET_RIDE_ENDED':
            return {
                ...state,
                rideEnded: action.payload,
            };
        case 'SET_SHOW_DIRECTIONS':
            return {
                ...state,
                showDirections: action.payload,
            };
        default:
            return state;
    }
};

export default rideReducer;
