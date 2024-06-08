import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import styles from '../styles/globalStyles';
import GlobalColors from '../styles/globalColors';
import { Icon, Avatar } from 'react-native-elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { firestoreDB } from '../config/firebase.config';
import { doc, getDoc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import FeedbackHost from '../components/FeedbackHost';
import { useSelector, useDispatch } from 'react-redux';
import * as Location from 'expo-location';
import { setLoading, setConfirmedWayPoints, setRideDetails, setDistance, setDuration, setFromRideLocation, setToRideLocation, setFare, setDriverInfo, setCoriders, setWayPoints, setCancelledByMe, setCancelledRiders, setRideEnded, setShowDirections, incMinutesPassed } from '../context/actions/rideActions';
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
  const [rideDetailsHeight, setRideDetailsHeight] = useState(190);

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
  const cancelledByMe = useSelector(state => state.ride.cancelledByMe);
  const riders = useSelector(state => state.ride.coriders);
  const wayPoints = useSelector(state => state.ride.wayPoints);
  const confirmedWaypoints = useSelector(state => state.ride.confirmedWayPoints);
  const cancelledRiders = useSelector(state => state.ride.cancelledRiders);
  const showDirection = useSelector(state => state.ride.showDirections);
  const minutesPassed = useSelector(state => state.ride.minutesPassed);
  const navigation = useNavigation();
  const rideID = 'Ri5o1r474TkoTNC0XUZ6';//useRoute.params?.requestId;
  const mapRef = useRef();
  const location = useSelector(state => state.ride.location)
  const YOUR_TASK_NAME = 'host-background-location-task';
  const dispatch = useDispatch();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [rerouteLocation, setRerouteLocation] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const dayIndexToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [targetTime, setTargetTime] = useState(null);

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
  const stopLocationUpdates = async () => {

    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(YOUR_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(YOUR_TASK_NAME);
      console.log('Location updates stopped.');
    } else {
      console.log('Task is not registered.');
    }
    const isTaskRegisteredRider = await TaskManager.isTaskRegisteredAsync('rider-background-location-task');
    if (isTaskRegisteredRider) {
      await Location.stopLocationUpdatesAsync('rider-background-location-task');
      console.log('Location updates stopped.');
    } else {
      console.log('Task is not registered.');
    }
  };
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
      await stopLocationUpdates();
      await Location.startLocationUpdatesAsync(YOUR_TASK_NAME, options);
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(YOUR_TASK_NAME);
      if (isTaskRegistered) {
        console.log('Location updates fine.');
      } else {
        console.log('Task is not registered.');
      }
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
  useEffect(() => {
    console.log('alert')
    confirmWayPoint();
  }, [confirmedWaypoints, location]);
  const confirmWayPoint = () => {
    console.log('During ride host', confirmedWaypoints)
    if (confirmedWaypoints.length > 0 && !confirmedWaypoints[confirmedWaypoints.length - 1][1]) {
      const wp = confirmedWaypoints[confirmedWaypoints.length - 1][0]
      if (!wp.riderName) {  //it is to rideLocation
        setShowFeedback(true);
        dispatch(setRideEnded(true))
        return;
      }
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
              if (showDirection) {
                const index = wayPoints.findIndex(w => w === wp);
                if (index == -1) {

                  Linking.openURL(`google.navigation:q=${toRideLocation.latitude},${toRideLocation.longitude}&mode=d`)
                } else {
                  Linking.openURL(`google.navigation:q=${wayPoints[index].latitude},${wayPoints[index].longitude}&mode=d`)
                }
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
        const rideDocRef = doc(collection(firestoreDB, 'ride'), rideID);
        const unsubscribe = onSnapshot(rideDocRef, async (rideSnapshot) => {
          try {
            const rideData = rideSnapshot.data();
            if (!rideData) {
              console.log('Ride data is null or undefined.');
              return;
            }
            rideData.id = rideSnapshot.id;
            console.log("Ride Data:", rideData);
            console.log(rideData)
            let wp = [];
            const ridersData = [];
            for (const rider of rideData.Riders) {
              if (rider.status === 'Cancelled') {
                if (!cancelledByMe && !cancelledRiders.includes(rider.rider)) {
                  console.log('Rider has cancelled the ride');
                  dispatch(setCancelledRiders([...cancelledRiders, rider.rider]))
                  const riderDocRef = doc(collection(firestoreDB, 'users'), rider.rider);
                  try {
                    const riderSnapshot = await getDoc(riderDocRef);
                    const riderData = riderSnapshot.data();
                    if (riderData) {
                      Alert.alert('Rider Cancelled', `${riderData.name} has cancelled the ride.`);
                    } else {
                      console.error(`Rider data not found for rider ID: ${rider.rider}`);
                    }
                  } catch (error) {
                    console.error('Error fetching rider data:', error);
                  }

                }
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
            dispatch(setRideDetails(rideData));
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
      dispatch(setCancelledByMe(true))
      const rideRef = doc(collection(firestoreDB, 'ride'), 'Ri5o1r474TkoTNC0XUZ6');
      const updatedRiders = [...rideDetails.Riders];
      for (let i = 0; i < rideDetails.Riders.length; i++) {
        const rider = rideDetails.Riders[i];
        await updateDoc(doc(firestoreDB, 'users', rider.rider), {
          fareDue: false
        });
        updatedRiders[i].status = "Cancelled";
      }

      await updateDoc(rideRef, { Riders: updatedRiders });
      console.log('Ride status updated successfully to "cancelled"');
      if (rideDetails.schedule) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sunday) through 6 (Saturday)
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const time = hours * 60 + minutes;
        const currentDayName = dayIndexToName[dayOfWeek];
        var penalty = false;
        if (schedule[currentDayName]) {
          const Other = schedule[currentDayName]['Other'];
          const Return = schedule[currentDayName]['Return'];
          const pickupTime = parseTime(Other);
          const dropOffTime = parseTime(Return);
          const scheduledTime = time <= pickupTime ? pickupTime : dropOffTime;
          penalty = time > scheduledTime - 720;
        }
      } else {
        penalty = (Timestamp.now() - rideDetails.created) > (5 * 60 * 1000)
      }
      if (penalty) {
        const userRef = doc(collection(firestoreDB, 'users'), currentUser._id);
        await updateDoc(userRef, { cancelledRides: currentUser.cancelledRides + 1 });
      }
      navigation.navigate('RequestCreation')
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };
  const updateRiderFares = async () => {
    console.log('decreasing fare...')
    try {
      const docRef = doc(collection(firestoreDB, 'ride'), rideID);
      const document = await getDoc(docRef);
  
      if (document.exists) {
        const data = document.data();
        const riders = data.Riders || [];
  
        // Update the fare for each rider
        const updatedRiders = riders.map(rider => {
          if (rider.fare !== undefined) {
            return {
              ...rider,
              fare: rider.fare - 10
            };
          }
          return rider;
        });
  
        // Update the document with the modified riders array
        await updateDoc(docRef,{ Riders: updatedRiders });
  
        console.log('Fares updated successfully.');
      } else {
        console.log('Document does not exist.');
      }
    } catch (error) {
      console.error('Error updating fares: ', error);
    }
  };
  
  
  const cancelRider = async (rider) => {
    try {
      dispatch(setCancelledRiders([...cancelledRiders, rider._id]))
      const rideRef = doc(collection(firestoreDB, 'ride'), rideID);
      const updatedRiders = [...rideDetails.Riders];
      for (let i = 0; i < rideDetails.Riders.length; i++) {
        if (rider._id == rideDetails.Riders[i]) {
          await updateDoc(doc(firestoreDB, 'users', rider._id), {
            fareDue: false
          });
          updatedRiders[i].status = "Cancelled";
          await updateDoc(rideRef, { Riders: updatedRiders });
          console.log('Rider status updated successfully to "cancelled"');
        }
      }

      if (rideDetails.schedule) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sunday) through 6 (Saturday)
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const time = hours * 60 + minutes;
        const currentDayName = dayIndexToName[dayOfWeek];
        var penalty = false;
        if (schedule[currentDayName]) {
          const Other = schedule[currentDayName]['Other'];
          const Return = schedule[currentDayName]['Return'];
          const pickupTime = parseTime(Other);
          const dropOffTime = parseTime(Return);
          const scheduledTime = time <= pickupTime ? pickupTime : dropOffTime;
          penalty = time > scheduledTime - 720;
        }
      } else {
        penalty = (Timestamp.now() - rideDetails.created) > (5 * 60 * 1000)
      }
      if (penalty) {
        const userRef = doc(collection(firestoreDB, 'users'), currentUser._id);
        await updateDoc(userRef, { cancelledRides: currentUser.cancelledRides + 1 });
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const handleMapReady = () => {
    setIsMapReady(false);
  };

  const showDirections = () => {
    dispatch(setShowDirections(true))
    Linking.openURL(`google.navigation:q=${wayPoints[0].latitude},${wayPoints[0].longitude}&mode=d`)
  }

  const handleGestureEvent = (event) => {
    const offsetY = -1 * event.nativeEvent.translationY;
    const newHeight = rideDetailsHeight + offsetY;

    if (event.nativeEvent.state === State.ACTIVE) {
      if (newHeight <= 190) {
        setRideDetailsHeight(190);
      } else if (newHeight >= 500) {
        setRideDetailsHeight(500);
      } else if (newHeight >= 190 && newHeight <= 500) {
        setRideDetailsHeight(newHeight);
      }
    }
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  };

  useEffect(() => {
    if (!isLoading) {
      setTimer();
    }
  }, [isLoading]);

  async function scheduleFareDecreaseNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        sound: 'default',
        title: `Time's Up`,
        body: `Waiting time has exceeded. Fare of riders will decrease per minute.`,
        data: { data: 'goes here' },
      },
      trigger: { seconds: 1 },
    });
    showFareDecreaseAlert();
  }
  
  const showFareDecreaseAlert =()=> {
    console.log('ALERT')
    Alert.alert(
      "Time's Up",
      `Waiting time has exceeded. Fare of all riders will decrease per minute.`,
      undefined,
      { cancelable: false }
    );
  }
 

  const setTimer = () => {
    setShowTimerPopup(true);

    // Get the current time
    const currentTime = new Date();

    // Set the target time 5 minutes from the current time
    const targetTime = new Date(currentTime.getTime() + 0.5 * 60000); // Adding 5 minutes in milliseconds
    setTargetTime(targetTime)
  }

  useEffect(() => {

    if (targetTime && showTimerPopup) {
    const interval = setTimeout(() => {
      // Get the current time
      const currentTime = new Date();

      // Calculate the time difference in milliseconds
      const timeDifference = targetTime - currentTime;
      console.log(timeDifference)
      if (timeDifference<0){
        
        console.log('time pass',(-timeDifference) / 60000 )
        console.log('min pass',minutesPassed)
        if((-timeDifference) / 60000 > minutesPassed){
          console.log('time to update...')
          updateRiderFares();
          dispatch(incMinutesPassed());
        }
      }
      // Convert time difference from milliseconds to seconds
      setTimeLeft(Math.floor(timeDifference / 1000));
      if (Math.abs(timeDifference/1000) < 0.9){
        scheduleFareDecreaseNotification()
      }
    }, 1000); // Update the timer every 0.1 second
  }
  },[targetTime, timeLeft]);


  return (
    <>
      <GestureHandlerRootView style={styles.container}>

        <View style={{ flexDirection: 'row' }} >
          <Text style={{ fontSize: 14, color: GlobalColors.background, paddingVertical: 7, paddingHorizontal: 15 }}>Route Distance: {distance} km</Text>
          <Text style={{ fontSize: 14, color: GlobalColors.background, marginLeft: 'auto', paddingVertical: 7, paddingHorizontal: 15 }}>Estimated Time: {formatDuration(duration)}</Text>

        </View>
        {showTimerPopup &&
          <View style={{ backgroundColor: 'red', padding: 10, borderRadius: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: GlobalColors.background, marginLeft: 'auto' }}>
              Waiting Time:
              {timeLeft >= 0 ?
                ` 0${Math.floor(timeLeft / 60)}:${timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}` :
                ` -0${Math.abs(Math.floor(-1 * timeLeft / 60))}:${Math.abs(timeLeft % 60) < 10 ? `0${Math.abs(timeLeft % 60)}` : Math.abs(timeLeft % 60)}`}
            </Text>
          </View>}
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
        <TouchableOpacity onPress={() => adjustMapViewport(fromRideLocation, toRideLocation)} style={{ position: 'absolute', left: 8, paddingTop: showTimerPopup ? 120 : 70, paddingHorizontal: 5 }}>
          <Icon name='street-view' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => setRerouteLocation(location.coords)} style={{ position: 'absolute', left: 45, paddingTop: showTimerPopup ? 120 : 70, paddingHorizontal: 5 }}>
          <Icon name='route' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => showDirections()} style={{ position: 'absolute', left: 80, paddingTop: showTimerPopup ? 120 : 70, paddingHorizontal: 5 }}>
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

              <TouchableOpacity style={styles.cancelButton} onPress={() => { cancelRide }}>
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
                        <Icon style={[styles.iconButton, { marginVertical: 0, padding: 7 }]} name="comment-dots" type="font-awesome-5" size={20} color={GlobalColors.primary} />
                      </TouchableOpacity>
                      {rider.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${rider.phoneNumber}`) }}>
                        <Icon style={[styles.iconButton, { marginVertical: 0, padding: 7 }]} name="phone-alt" type="font-awesome-5" size={20} color={GlobalColors.primary} />
                      </TouchableOpacity>}
                    </View>
                    <TouchableOpacity style={[styles.cancelButton, { marginTop: 0, padding: 4 }]} onPress={() => { cancelRider(rider) }}>
                      <Text style={[styles.cancelButtonText, { fontSize: 15 }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Animated.View>
          </PanGestureHandler>)}
      </GestureHandlerRootView>
      {showFeedback && <FeedbackHost riders={riders} visible={showFeedback} />}

    </>
  );
}

export default DuringRideHost;
