import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import styles from '../styles/globalStyles';
import GlobalColors from '../styles/globalColors';
import { Icon, Avatar } from 'react-native-elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { firestoreDB } from '../config/firebase.config';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import FeedbackHost from '../components/FeedbackHost';
import { useSelector, useDispatch } from 'react-redux';
import * as Location from 'expo-location';
import { setLoading, setConfirmedWayPoints, setRideDetails, setDistance, setDuration, setFromRideLocation, setToRideLocation, setFare, setDriverInfo, setCoriders, setWayPoints } from '../context/actions/rideActions';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import MapViewDirections from 'react-native-maps-directions';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DuringRideHost = () => {
  const [showFeedback, setShowFeedback] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false);
  const [rideDetailsHeight, setRideDetailsHeight] = useState(200);

  const initialRegion = {
    latitude: 31.480864,
    longitude: 74.303114,
    latitudeDelta: 0.0102,
    longitudeDelta: 0.0101,
  };
  const currentUser = { _id: 'vzKZXzwFtcfEIG7ctsqmLXsfIJT2' } //useSelector((state) => state.user.user);
  const isLoading = useSelector(state => state.ride.isLoading);
  const rideDetails = useSelector(state => state.ride.rideDetails);
  const distance = useSelector(state => state.ride.distance);
  const duration = useSelector(state => state.ride.duration);
  const fromRideLocation = useSelector(state => state.ride.fromRideLocation);
  const toRideLocation = useSelector(state => state.ride.toRideLocation);
  const fare = useSelector(state => state.ride.fare);
  const riders = useSelector(state => state.ride.coriders);
  const wayPoints = useSelector(state => state.ride.wayPoints);
  const confirmedWaypoints = useSelector(state => state.ride.confirmedWayPoints);
  const navigation = useNavigation();
  const rideID = 'Ri5o1r474TkoTNC0XUZ6';//useRoute.params?.requestId;
  const mapRef = useRef();
  const location = useSelector(state => state.ride.location)
  const YOUR_TASK_NAME = 'background-location-task';
  const dispatch = useDispatch();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [rerouteLocation, setRerouteLocation] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas?.projectId,
      })

    } else {
      alert('Push Notifications are not supported on this device');
    }

    return token;
  }

  const requestLocationPermissions = async () => {
    try {
      // Request foreground permissions first
      const foregroundPermissionResult = await Location.requestForegroundPermissionsAsync();
      if (foregroundPermissionResult.status !== 'granted') {
        console.log('Foreground permission to access location was denied');
        return;
      }

      // If foreground permissions are granted, then request background permissions
      const backgroundPermissionResult = await Location.requestBackgroundPermissionsAsync();
      if (backgroundPermissionResult.status !== 'granted') {
        console.log('Background permission to access location was denied');
        return;
      }

      console.log('Location permissions granted. Starting location updates...');

    } catch (error) {
      console.error('Error requesting location permissions:', error.message);
    }
  };
  async function startLocationUpdates() {
    await requestLocationPermissions()
    const options = {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000, // Update every 1 second
      distanceInterval: 1, // Update every 1 meters
    };
    async function registerBackgroundFetchAsync() {
      return BackgroundFetch.registerTaskAsync(YOUR_TASK_NAME, {
        minimumInterval: 1 * 30, // task will fire 30 sec after app is backgrounded
      });
    }

    try {
    //  await Location.startLocationUpdatesAsync(YOUR_TASK_NAME, options);
      //  await registerBackgroundFetchAsync()
      console.log('Started receiving location updates.');
    } catch (error) {
      console.error('Error starting location updates:', error.message);
    }
  }

  const handleDirectionReady = (result) => {
    dispatch(setDistance(result.distance.toFixed(2)));
    dispatch(setDuration(result.duration));
    adjustMapViewport(fromRideLocation, toRideLocation);
  };

  const confirmWayPoint = () => {
    if (confirmedWaypoints.length > 0 && !confirmedWaypoints[confirmedWaypoints.length - 1][1]) {
      const wp = confirmedWaypoints[confirmedWaypoints.length - 1][0]
      // Display alert to confirm waypoint
      Alert.alert(
        `Confirm ${wp.type}`,
        `Have you ${wp.type === 'Pickup' ? 'picked up' : 'dropped off'} ${wp.riderName}?`,
        [
          {
            text: `Confirm ${wp.type}`,
            onPress: () => {
              // Set the last waypoint to true
              const updatedWaypoints = [...confirmedWaypoints];
              updatedWaypoints[confirmedWaypoints.length - 1][1] = true;
              dispatch(setConfirmedWayPoints(updatedWaypoints));
              // Navigate to next
              const index = wayPoints.findIndex(w => w === wp);
              if (index == -1) {
                Linking.openURL(`google.navigation:q=${toRideLocation.latitude},${toRideLocation.longitude}&mode=d`)
              } else {
                Linking.openURL(`google.navigation:q=${wayPoints[index].latitude},${wayPoints[index].longitude}&mode=d`)
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  const adjustMapViewport = (coordinate1, coordinate2) => {
    let minLat, maxLat, minLng, maxLng = 0;
    if (coordinate1 && coordinate2 && location && wayPoints) {
      minLat = Math.min(
        coordinate1.latitude,
        coordinate2.latitude,
        location.coords.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude))
      );
      maxLat = Math.max(
        coordinate1.latitude,
        coordinate2.latitude,
        location.coords.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude))
      );
      minLng = Math.min(
        coordinate1.longitude,
        coordinate2.longitude,
        location.coords.longitude,
        ...(wayPoints.map(wayPoint => wayPoint.longitude))
      );
      maxLng = Math.max(
        coordinate1.longitude,
        coordinate2.longitude,
        location.coords.longitude,
        ...(wayPoints.map(wayPoint => wayPoint.longitude))
      );

    } else if (coordinate1 && coordinate2 && wayPoints) {
      minLat = Math.min(
        coordinate1.latitude,
        coordinate2.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude))
      );
      maxLat = Math.max(
        coordinate1.latitude,
        coordinate2.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude))
      );
      minLng = Math.min(
        coordinate1.longitude,
        coordinate2.longitude,
        ...(wayPoints.map(wayPoint => wayPoint.longitude))
      );
      maxLng = Math.max(
        coordinate1.longitude,
        coordinate2.longitude,
        ...(wayPoints.map(wayPoint => wayPoint.longitude))
      );


    } else if (coordinate1 && coordinate2 && location) {
      minLat = Math.min(coordinate1.latitude, coordinate2.latitude, location.latitude);
      maxLat = Math.max(coordinate1.latitude, coordinate2.latitude, location.latitude);
      minLng = Math.min(coordinate1.longitude, coordinate2.longitude, location.longitude);
      maxLng = Math.max(coordinate1.longitude, coordinate2.longitude, location.longitude);
    } else if (coordinate1 && coordinate2) {
      minLat = Math.min(coordinate1.latitude, coordinate2.latitude);
      maxLat = Math.max(coordinate1.latitude, coordinate2.latitude);
      minLng = Math.min(coordinate1.longitude, coordinate2.longitude);
      maxLng = Math.max(coordinate1.longitude, coordinate2.longitude);

    } else {
      return;
    }
    const padding = 50; // Adjust the padding as needed

    // Adjust map viewport to fit the bounding box
    mapRef.current?.fitToCoordinates(
      [
        { latitude: minLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng },
      ],
      {
        edgePadding: {
          top: padding,
          right: padding,
          bottom: padding * 4,
          left: padding,
        },
        animated: true,
      }
    )
  };
  useEffect(() => {
    // Call the function to start receiving location updates
    startLocationUpdates();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const rideDocRef = doc(collection(firestoreDB, 'ride'), 'Ri5o1r474TkoTNC0XUZ6');
        const unsubscribe = onSnapshot(rideDocRef, async (rideSnapshot) => {
          try {
            const rideData = rideSnapshot.data();
            if (!rideData) {
              console.error('Ride data is null or undefined.');
              return;
            }
            console.log(rideData)
            let wp = [];
            const ridersData = [];
            for (const rider of rideData.Riders) {
              if (rider.status == 'Cancelled') {
                console.log('rider is out')
                continue;
              }

              if (rider.rider !== currentUser._id) {
                const riderDocRef = doc(collection(firestoreDB, 'users'), rider.rider);
                try {
                  const riderSnapshot = await getDoc(riderDocRef);
                  const riderData = riderSnapshot.data();
                  if (riderData) {
                    ridersData.push(riderData);
                    rider.from.riderName = riderData.name
                    rider.to.riderName = riderData.name
                    rider.from.type = 'Pickup'
                    rider.to.type = 'DropOff'
                    wp.push(rider.from)
                    wp.push(rider.to)
                  } else {
                    console.error(`Rider data not found for rider ID: ${rider.rider}`);
                  }
                } catch (error) {
                  console.error('Error fetching rider data:', error);
                }
              }
            }
            dispatch(setWayPoints(wp));
            dispatch(setCoriders(ridersData));
            dispatch(setFromRideLocation(rideData.from));
            dispatch(setToRideLocation(rideData.to))
            dispatch(setLoading(false));
            adjustMapViewport(rideData.from, rideData.to)
          } catch (error) {
            console.error('Error processing ride data:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up snapshot listener:', error);
      }
      console.log('Done Fetching')

    };

    fetchData();
  }, []);
  const formatDuration = (durationInMinutes) => {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.floor(durationInMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const cancelRide = async () => {
    try {
      const rideRef = doc(collection(firestoreDB, 'ride'), rideID);
      const rideSnapshot = await getDoc(rideRef);
      const rideData = rideSnapshot.data();
      const updatedRiders = [...rideData.Riders];
      for (let i = 0; i < rideData.Riders.length; i++) {
        const rider = rideData.Riders[i];
        await updateDoc(doc(firestoreDB, 'users', rider.rider), {
          fareDue: false
        });
        updatedRiders[i].status = "Cancelled";
      }

      await updateDoc(rideRef, { Riders: updatedRiders });
      console.log('Ride status updated successfully to "cancelled"');
      const userRef = doc(collection(firestoreDB, 'users'), currentUser._id);
      await updateDoc(userRef, { cancelledRides: currentUser.cancelledRides + 1 });
      navigation.navigate('RequestCreation')
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const cancelRider = async (rider) => {
    try {
      const rideRef = doc(collection(firestoreDB, 'ride'), rideID);
      const rideSnapshot = await getDoc(rideRef);
      const rideData = rideSnapshot.data();
      const updatedRiders = [...rideData.Riders];
      for (let i = 0; i < rideData.Riders.length; i++) {
        if (rider._id == rideData.Riders[i]){
        await updateDoc(doc(firestoreDB, 'users', rider._id), {
          fareDue: false
        });
        updatedRiders[i].status = "Cancelled";
        await updateDoc(rideRef, { Riders: updatedRiders });
      console.log('Rider status updated successfully to "cancelled"');
      }
      }

      
      const userRef = doc(collection(firestoreDB, 'users'), currentUser._id);
      await updateDoc(userRef, { cancelledRides: currentUser.cancelledRides + 1 });
      navigation.navigate('RequestCreation')
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const handleMapReady = () => {
    setIsMapReady(false);
  };

  const showDirections = () => {
    Linking.openURL(`google.navigation:q=${wayPoints[0].latitude},${wayPoints[0].longitude}&mode=d`)
  }

  const handleGestureEvent = (event) => {
    const offsetY = -1 * event.nativeEvent.translationY;
    const newHeight = rideDetailsHeight + offsetY;

    if (event.nativeEvent.state === State.ACTIVE) {
      if (newHeight <= 200) {
        setRideDetailsHeight(200);
      } else if (newHeight >= 500) {
        setRideDetailsHeight(500);
      } else if (newHeight >= 200 && newHeight <= 500) {
        setRideDetailsHeight(newHeight);
      }
    }
  };

  return (
    <>
      <GestureHandlerRootView style={styles.container}>

        <View style={{ flexDirection: 'row' }} >
          <Text style={{ fontSize: 14, color: GlobalColors.background, paddingVertical: 7, paddingHorizontal: 15 }}>Route Distance: {distance} km</Text>
          <Text style={{ fontSize: 14, color: GlobalColors.background, marginLeft: 'auto', paddingVertical: 7, paddingHorizontal: 15 }}>Estimated Time: {formatDuration(duration)}</Text>

        </View>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          followsUserLocation
          onMapReady={handleMapReady}
        >


          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Current Location"
            />
          )}


          {toRideLocation && (
            <Marker
              coordinate={{
                latitude: toRideLocation.latitude,
                longitude: toRideLocation.longitude,
              }}
              title={toRideLocation.name}
              pinColor={GlobalColors.primary}
            />
          )}
          {fromRideLocation && (
            <Marker
              coordinate={{
                latitude: fromRideLocation.latitude,
                longitude: fromRideLocation.longitude,
              }}
              title={fromRideLocation.name}
            />
          )}
          {wayPoints && wayPoints.map(waypoint => {
            return (
              <Marker
                coordinate={{
                  latitude: waypoint.latitude,
                  longitude: waypoint.longitude
                }}
                title={`${waypoint.riderName} (${waypoint.type})`}
                pinColor={'tan'}
              />
            );
          })}

          {isMapReady && !isLoading && (

            <MapViewDirections
              origin={rerouteLocation ? rerouteLocation : fromRideLocation}
              destination={toRideLocation}
              apikey="AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8"
              strokeWidth={4}
              strokeColor={GlobalColors.primary}
              waypoints={wayPoints}
              optimizeWaypoints={false}
              onReady={handleDirectionReady}
            />

          )}
        </MapView>
        <TouchableOpacity onPress={() => adjustMapViewport(fromRideLocation, toRideLocation)} style={{ position: 'absolute', left: 45, paddingTop: 75, paddingHorizontal: 5 }}>
          <Icon name='street-view' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => setRerouteLocation(location.coords)} style={{ position: 'absolute', left: 80, paddingTop: 75, paddingHorizontal: 5 }}>
          <Icon name='route' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => showDirections()} style={{ position: 'absolute', left: 115, paddingTop: 75, paddingHorizontal: 5 }}>
          <Icon name='directions' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        {isLoading ? (
          <ActivityIndicator size={"large"} style={{ padding: 25 }} color={GlobalColors.primary} />
        ) :
          (<PanGestureHandler onGestureEvent={handleGestureEvent}>
            <Animated.View style={[styles.rideDetails, { height: rideDetailsHeight }]}>
              <View style={{ flexDirection: 'row' }}>
                <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                <Text style={styles.locationText}> From: {fromRideLocation?.name} </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                <Text style={styles.locationText}> To: {toRideLocation?.name} </Text>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
                <Text style={styles.cancelButtonText}>CANCEL RIDE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setRideDetailsHeight(200 + 70 * riders.length) }}>
                <Text style={{ color: GlobalColors.primary, fontSize: 25, fontWeight: 'bold' }}>Riders</Text>
              </TouchableOpacity>
              {riders.length == 0 && <Text>No Riders for this ride</Text>}
              {riders.map((rider, index) => (
                <View key={index} style={styles.detailsAndFareContainer}>
                  {rider?.profilePic ? <Avatar rounded size="large" source={{ uri: rider?.profilePic }} />
                    : (
                      <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                      />)}
                  <View style={styles.detailsContainer}>
                    <Text style={styles.rideInfo}>{rider?.name}</Text>
                    <Text style={[styles.rideInfo, { fontSize: 10 }]}>{rider.gender === 0 ? 'Male' : 'Female'}</Text>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" type="font-awesome" size={16} color="gold" />
                      <Text style={styles.rating}>{rider.rating}</Text>
                    </View>
                  </View>
                  <View>
                    <View style={styles.callChatIcons}>
                      <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', rider) }}>
                        <Icon style={[styles.iconButton,{marginVertical: 0, padding: 7}]} name="comment-dots" type="font-awesome-5" size={20} color={GlobalColors.primary} />
                      </TouchableOpacity>
                      {rider.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${rider.phoneNumber}`) }}>
                        <Icon style={[styles.iconButton,{marginVertical: 0, padding: 7}]} name="phone-alt" type="font-awesome-5" size={20} color={GlobalColors.primary} />
                      </TouchableOpacity>}
                    </View>
                    <TouchableOpacity style={[styles.cancelButton,{marginTop:0, padding:4}]} onPress={cancelRider(rider)}>
                      <Text style={[styles.cancelButtonText, {fontSize: 15}]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Animated.View>
          </PanGestureHandler>)}
      </GestureHandlerRootView>
      {showFeedback && <FeedbackHost riders={[riders]} visible={true} />}
    </>
  );
}

export default DuringRideHost;
