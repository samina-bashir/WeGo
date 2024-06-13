import React, { Component, useEffect, useRef, useState } from 'react';
import { View, Text, Button, TouchableOpacity, Animated, Linking, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import styles from '../styles/globalStyles';
import { Icon, Overlay, Rating, Avatar, Input } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import PayNowOverlay from '../components/PayNow';
import { useNavigation, useRoute } from '@react-navigation/native';
import { firestoreDB } from '../config/firebase.config';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { setLoading, setLocation, setRideDetails, setDistance, setDuration, setFromLocation, setToLocation, setFromRideLocation, setToRideLocation, setFare, setDriverInfo, setCoriders, setWayPoints, setHostLocation, setRideEnded, incrementFareBy10, incMinutesPassed } from '../context/actions/rideActions';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import Store from '../context/store';

const DuringRideScreen = () => {
  const [payNow, setPayNow] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false);
  const minutesPassed = useSelector(state => state.ride.minutesPassed)
  const [targetTime, setTargetTime] = useState(null);
  const [timerTime, setTimerTime] = useState(30);
  const [rideDetailsHeight, setRideDetailsHeight] = useState(280);
  const initialRegion = {
    latitude: 31.480864,
    longitude: 74.303114,
    latitudeDelta: 0.0102,
    longitudeDelta: 0.0101,
  };
  const notificationListener = useRef();
  const responseListener = useRef();
  const currentUser = useSelector((state) => state.user.user);
  //{ _id: 'vzKZXzwFtcfEIG7ctsqmLXsfIJT2', name: 'Samina' } //
  const isLoading = useSelector(state => state.ride.isLoading);
  const rideDetails = useSelector(state => state.ride.rideDetails);
  const distance = useSelector(state => state.ride.distance);
  const duration = useSelector(state => state.ride.duration);
  const fromLocation = useSelector(state => state.ride.fromLocation);
  const toLocation = useSelector(state => state.ride.toLocation);
  const fromRideLocation = useSelector(state => state.ride.fromRideLocation);
  const toRideLocation = useSelector(state => state.ride.toRideLocation);
  const fare = useSelector(state => state.ride.fare);
  const driverInfo = useSelector(state => state.ride.driverInfo);
  const coriders = useSelector(state => state.ride.coriders);
  const wayPoints = useSelector(state => state.ride.wayPoints);
  const cancelledByMe = useSelector(state => state.ride.cancelledByMe);
  const hostLocation = useSelector(state => state.ride.hostLocation);
  const rideEnded = useSelector(state => state.ride.rideEnded);
  const navigation = useNavigation();
  const [driverData, setDriverData] = useState(null);
  const [rerouteLocation, setRerouteLocation] = useState(null);
  const dayIndexToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rideID = 'Ri5o1r474TkoTNC0XUZ6'//useRoute().params?.requestId;
  const mapRef = useRef();
  const location = useSelector(state => state.ride.location)
  const YOUR_TASK_NAME = 'rider-background-location-task';
  const dispatch = useDispatch();
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [showTimerPopup, setShowTimerPopup] = useState(false);

  useEffect(()=>{
   
  },[timerTime])

  async function scheduleEndNotification(toLocation) {
    await Notifications.scheduleNotificationAsync({
      content: {
        sound: 'default',
        title: `Ride Ended`,
        body: `You have almost reached end of your ride. Click to pay for the ride.`,
        data: { data: 'goes here' },
      },
      trigger: { seconds: 1 },
    });
  }

  async function scheduleFareIncreaseNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        sound: 'default',
        title: `Time's Up`,
        body: `Waiting time has exceeded. Your fare will increase per minute.`,
        data: { data: 'goes here' },
      },
      trigger: { seconds: 1 },
    });
    showFareIncreaseAlert();
  }
  
  const showFareIncreaseAlert =()=> {
    console.log('ALERT')
    Alert.alert(
      "Time's Up",
      `Waiting time has exceeded. Your fare will increase per minute.`,
      undefined,
      { cancelable: false }
    );
  }
 

  useEffect(() => {
    if(!isLoading)
      setTimer();
  }, [isLoading]);
  const setTimer = () => {
    setShowTimerPopup(true);

    // Get the current time
    const currentTime = new Date();

    // Set the target time 5 minutes from the current time
    const targetTime = new Date(currentTime.getTime() + 5 * 60000); // Adding 5 minutes in milliseconds
    setTargetTime(targetTime)
  }

  const updateCurrentUserFare = async () => {
    try {
      const docRef = doc(collection(firestoreDB, 'ride'), rideID);
      const doc = await getDoc(docRef);
  
      if (doc.exists) {
        const data = doc.data();
        const riders = data.Riders || [];
  
        // Update the fare for the current user
        const updatedRiders = riders.map(rider => {
          if (rider.rider === currentUser._id && rider.fare !== undefined) {
            return {
              ...rider,
              fare: rider.fare + 10
            };
          }
          return rider;
        });
  
        // Update the document with the modified riders array
        await updateDoc(docRef,{ Riders: updatedRiders });
  
        console.log('Fare updated successfully for the current user.');
      } else {
        console.log('Document does not exist.');
      }
    } catch (error) {
      console.error('Error updating fare: ', error);
    }
  };

  useEffect(() => {
    if (targetTime) {
    const interval = setTimeout(() => {
      // Get the current time
      const currentTime = new Date();

      // Calculate the time difference in milliseconds
      const timeDifference = targetTime - currentTime;
      console.log(timeDifference)
      console.log('fares',fare)
      if (timeDifference<0){
        
        console.log((-timeDifference) / 60000 )
        console.log('min', minutesPassed)
        console.log('faresss',fare)
        if((-timeDifference) / 60000 > minutesPassed){
          updateCurrentUserFare();
          dispatch(incrementFareBy10());
          dispatch(incMinutesPassed());
        }
      }
      // Convert time difference from milliseconds to seconds
      setTimeLeft(Math.floor(timeDifference / 1000));
      if (Math.abs(timeDifference/1000) < 1){
        scheduleFareIncreaseNotification()
      }
    }, 1000); // Update the timer every second

    // Return cleanup function
  }
  },[targetTime, timeLeft]);
  const requestLocationPermissions = async () => {
    console.log('trying permission...')
    try {
      // Request foreground permissions first
      const foregroundPermissionResult = await Location.requestForegroundPermissionsAsync();
      if (foregroundPermissionResult.status !== 'granted') {
        console.log('Foreground permission to access location was denied');
        return;
      }
      console.log('got foreground ones...')
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
    console.log('permission ahead...');
    await requestLocationPermissions();
    const options = {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1, // Update every 1 msecond
      distanceInterval: 1, // Update every 0.1 meters
      showsBackgroundLocationIndicator: true,
      deferredUpdatesInterval: 0,
      deferredUpdatesDistance: 0,
      foregroundService: {
        notificationTitle: "title",
        notificationBody: "body",
      },

    };
    async function registerBackgroundFetchAsync() {
      return BackgroundFetch.registerTaskAsync(YOUR_TASK_NAME, {
        minimumInterval: 1, // task will fire 30 sec after app is backgrounded
      });
    }

    try {
      await stopLocationUpdates()
      const isTaskRegistered1 = await TaskManager.isTaskRegisteredAsync(YOUR_TASK_NAME);
      console.log('off', isTaskRegistered1)
      await Location.startLocationUpdatesAsync(YOUR_TASK_NAME, options);
      //  await registerBackgroundFetchAsync()
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(YOUR_TASK_NAME);
      if (!isTaskRegistered) {
        await Location.startLocationUpdatesAsync(YOUR_TASK_NAME, options);
        const isTaskRegistered22 = await TaskManager.isTaskRegisteredAsync(YOUR_TASK_NAME);
        while (!isTaskRegistered22) {
          console.log('noooo')
          await Location.startLocationUpdatesAsync(YOUR_TASK_NAME, options);
        }
      } else {
        console.log('Task is already registered and running');
      }
      console.log('Started receiving location updates.');
    } catch (error) {
      console.error('Error starting location updates:', error.message);
    }
  }
  const stopLocationUpdates = async () => {

    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(YOUR_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(YOUR_TASK_NAME);
      console.log('Location updates stopped.');
    } else {
      console.log('Task is not registered.');
    }

    const isTaskRegisteredHost = await TaskManager.isTaskRegisteredAsync('host-background-location-task');
    if (isTaskRegisteredHost) {
      await Location.stopLocationUpdatesAsync('host-background-location-task');
      console.log('Location updates stopped.');
    } else {
      console.log('Task is not registered.');
    }
  };
  const handleDirectionReady = (result) => {
    console.log(`Distance: ${result.distance} km`);
    console.log(`Duration: ${result.duration} min.`);
    dispatch(setDistance(result.distance.toFixed(2)));
    dispatch(setDuration(result.duration));
  };

  const adjustMapViewport = (coordinate1, coordinate2) => {
    console.log('f r', fare)
    let minLat, maxLat, minLng, maxLng = 0;
    if (coordinate1 && coordinate2 && location && wayPoints) {
      minLat = Math.min(
        coordinate1.latitude,
        coordinate2.latitude,
        location?.coords.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude))
      );
      maxLat = Math.max(
        coordinate1.latitude,
        coordinate2.latitude,
        location?.coords.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude))
      );
      minLng = Math.min(
        coordinate1?.longitude,
        coordinate2?.longitude,
        location?.coords?.longitude,
        ...(wayPoints.map(wayPoint => wayPoint?.longitude))
      );
      maxLng = Math.max(
        coordinate1?.longitude,
        coordinate2?.longitude,
        location?.coords?.longitude,
        ...(wayPoints.map(wayPoint => wayPoint?.longitude))
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
        coordinate1?.longitude,
        coordinate2?.longitude,
        ...(wayPoints.map(wayPoint => wayPoint?.longitude))
      );
      maxLng = Math.max(
        coordinate1?.longitude,
        coordinate2?.longitude,
        ...(wayPoints.map(wayPoint => wayPoint?.longitude))
      );
      console.log(maxLat)
      console.log(
        coordinate1.latitude,
        coordinate2.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude)))
      console.log(
        coordinate1.latitude,
        coordinate2.latitude,
        ...(wayPoints.map(wayPoint => wayPoint?.longitude)))

    } else if (coordinate1 && coordinate2 && location) {
      minLat = Math.min(coordinate1.latitude, coordinate2.latitude, location.latitude);
      maxLat = Math.max(coordinate1.latitude, coordinate2.latitude, location.latitude);
      minLng = Math.min(coordinate1?.longitude, coordinate2?.longitude, location?.longitude);
      maxLng = Math.max(coordinate1?.longitude, coordinate2?.longitude, location?.longitude);
    } else if (coordinate1 && coordinate2) {
      minLat = Math.min(coordinate1.latitude, coordinate2.latitude);
      maxLat = Math.max(coordinate1.latitude, coordinate2.latitude);
      minLng = Math.min(coordinate1?.longitude, coordinate2?.longitude);
      maxLng = Math.max(coordinate1?.longitude, coordinate2?.longitude);

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
          bottom: 260,
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
  async function registerForPushNotificationsAsync() {
    let token;


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


    return token;
  }

  useEffect(() => {
    console.log('ahh')
    const thresh = 5000000;
    var i = 0;
    while(i<thresh){
      i=i+1
    }
    if (!rideEnded) {
      console.log(calculateDistance(location?.coords.latitude, location?.coords?.longitude, toLocation?.latitude, toLocation?.longitude))
      if (calculateDistance(location?.coords.latitude, location?.coords?.longitude, toLocation?.latitude, toLocation?.longitude) < thresh) {
        dispatch(setRideEnded(true))

        registerForPushNotificationsAsync();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log(notification)
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log(response);
        });

        scheduleEndNotification(toLocation);
        setPayNow(true);
        while (!rideEnded) {
          var a = 0;
          console.log(rideEnded)
          break;
        }
      }
    }
  }, [location]);

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  useEffect(() => {

    fetchData();
  }, []);
  const fetchData = async () => {
    dispatch(setLoading(true));
    try {
      const rideDocRef = doc(collection(firestoreDB, 'ride'), rideID);
      const unsubscribe = onSnapshot(rideDocRef, async (rideSnapshot) => {
        try {
          const rideData = rideSnapshot.data();
          if (!rideData) {
            console.error('Ride data is null or undefined.');
            return;
          }
          console.log('Ride data:', rideData);
          rideData.id = rideSnapshot.id;
          dispatch(setHostLocation(rideData.location))
          dispatch(setFromRideLocation(rideData.from))
          dispatch(setToRideLocation(rideData.to))
          const currentUserRider = rideData.Riders.find(rider => rider.rider === currentUser._id);
          if (!currentUserRider) {
            console.log('Current user rider data not found in ride.');
            return;
          }
          await updateDoc(doc(firestoreDB, 'users', currentUser._id), {
            fareDue: true
          });
          const driverInfoDocRef = doc(collection(firestoreDB, 'driverInfo'), rideData.Host);
          const userDocRef = doc(collection(firestoreDB, 'users'), rideData.Host);

          // Fetch user data and driverInfo data concurrently
          const [driverInfoSnapshot, userSnapshot] = await Promise.all([
            getDoc(driverInfoDocRef),
            getDoc(userDocRef)
          ]);

          const driverInfoData = driverInfoSnapshot.data();
          const userData = userSnapshot.data();

          if (!driverInfoData || !userData) {
            console.error('Driver info data or user data is null or undefined.');
            return;
          }
          console.log(userData)
          // Set the driverInfo state
          // setDriverInfo(driverInfoData);
          // Set the userData state
          setDriverData(userData);
          let wp = [];
          const coridersData = [];

          for (const rider of rideData.Riders) {
            if (rider.status == 'Cancelled') {
              console.log('rider is out')
              if (rider.rider == currentUser._id && !cancelledByMe) {
                Alert.alert(
                  'Ride Cancelled',
                  `Unfortunately, your Host ${userData.name} has cancelled the ride.`,
                  [
                    {
                      text: 'Acknowledge',
                      onPress: () => {
                        navigation.navigate('Request Creation')
                      }
                    }
                  ]
                );
              }
              continue;
            }

            if (rider.rider !== currentUser._id) {
              const riderDocRef = doc(collection(firestoreDB, 'users'), rider.rider);
              try {
                const riderSnapshot = await getDoc(riderDocRef);
                const riderData = riderSnapshot.data();
                if (riderData) {
                  rider.from.riderName = riderData.name
                  rider.to.riderName = riderData.name
                  rider.from.type = 'Pickup'
                  rider.to.type = 'DropOff'
                  wp.push(rider.from)
                  wp.push(rider.to)
                  coridersData.push(riderData);
                } else {
                  console.error(`Rider data not found for rider ID: ${rider.rider}`);
                }
              } catch (error) {
                console.error('Error fetching rider data:', error);
              }
            } else {
              dispatch(setFare(rider.fare));
              dispatch(setFromLocation(rider.from));
              dispatch(setToLocation(rider.to));
              console.log('to', rider.to)
              rider.from.riderName = currentUser.name
              rider.to.riderName = currentUser.name
              rider.from.type = 'Pickup'
              rider.to.type = 'DropOff'
              wp.push(rider.from)
              wp.push(rider.to)
            }
          }
          dispatch(setRideDetails(rideData))
          dispatch(setFromRideLocation(rideData.from));
          dispatch(setToRideLocation(rideData.to));
          dispatch(setDriverInfo(driverInfoData));
          dispatch(setCoriders(coridersData));
          dispatch(setWayPoints(wp));
          dispatch(setLoading(false));
          adjustMapViewport(rideData.from, rideData.to)
        } catch (error) {
          console.error('Error processing ride data:', error);
        }

      });

    } catch (error) {
      console.error('Error setting up snapshot listener:', error);
    }

  };

  const cancelRide = async () => {
    try {

      const currentUserIndex = rideDetails.Riders.findIndex(rider => rider.rider === currentUser._id);
      const rideRef = doc(collection(firestoreDB, 'ride'), 'Ri5o1r474TkoTNC0XUZ6');
      if (currentUserIndex !== -1) {
        const updatedRiders = [...rideDetails.Riders];
        updatedRiders[currentUserIndex].status = "Cancelled";
        await updateDoc(rideRef, { Riders: updatedRiders });

      } else {
        console.error("Current user is not a rider in this ride.");
        return;
      }

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

  const handleMapReady = () => {
    setIsMapReady(true);

  };

  const handleGestureEvent = (event) => {
    const offsetY = -1 * event.nativeEvent.translationY;
    const newHeight = rideDetailsHeight + offsetY;

    if (event.nativeEvent.state === State.ACTIVE) {
      if (newHeight <= 280) {
        setRideDetailsHeight(280);
      } else if (newHeight >= 600) {
        setRideDetailsHeight(600);
      } else if (newHeight >= 280 && newHeight <= 600) {
        setRideDetailsHeight(newHeight);
      }
    }
  };

  const formatDuration = (durationInMinutes) => {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.floor(durationInMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  };

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
          onMapReady={handleMapReady} // Set the onMapReady callback
        >

          {location && (
            <Marker
              coordinate={{
                latitude: location?.coords.latitude,
                longitude: location?.coords?.longitude,
              }}
              title="Current Location"
            />
          )}
          {hostLocation ? (
            <Marker
              coordinate={{
                latitude: hostLocation?.coords.latitude,
                longitude: hostLocation?.coords?.longitude,
              }}
              title={`${driverData?.name} is here!`}
              image={require('../assets/map_marker.png')}
            />
          ) : fromRideLocation &&
          (
            <Marker

              coordinate={{
                latitude: fromRideLocation?.latitude,
                longitude: fromRideLocation?.longitude,
              }}
              title={`${driverData?.name} is here!`}
              image={require('../assets/map_marker.png')}

            />
          )
          }
          {toLocation && (
            <Marker
              coordinate={{
                latitude: toLocation.latitude,
                longitude: toLocation?.longitude,
              }}
              title={'My Dropoff'}
              pinColor={GlobalColors.primary}
            />
          )}
          {fromLocation && (
            <Marker
              coordinate={{
                latitude: fromLocation.latitude,
                longitude: fromLocation?.longitude,
              }}
              title={'My Pickup'}
            />
          )}
          {toRideLocation && (
            <Marker
              coordinate={{
                latitude: toRideLocation.latitude,
                longitude: toRideLocation?.longitude,
              }}
              title={toRideLocation.name}
              pinColor={GlobalColors.primary}
            />
          )}
          {fromRideLocation && (
            <Marker
              coordinate={{
                latitude: fromRideLocation.latitude,
                longitude: fromRideLocation?.longitude,
              }}
              title={fromRideLocation.name}
            />
          )}
          {wayPoints && wayPoints.map((waypoint, index) => {
            if (waypoint.riderName !== currentUser.name) {
              return (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: waypoint.latitude,
                    longitude: waypoint.longitude
                  }}
                  title={`${waypoint.riderName} (${waypoint.type})`}
                  pinColor={'tan'}
                />
              );
            }
            return null;
          })}

          {isMapReady && !isLoading && ( // Render the directions only when the map is ready
            <MapViewDirections
              origin={rerouteLocation ? rerouteLocation : fromRideLocation}
              destination={toRideLocation}
              apikey="AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8"
              strokeWidth={4}
              strokeColor={GlobalColors.primary}
              waypoints={wayPoints}
              precision="high"
              mode='DRIVING'
              optimizeWaypoints={false}
              onReady={handleDirectionReady}

            />
          )}
        </MapView>
        <TouchableOpacity onPress={() => adjustMapViewport(fromRideLocation, toRideLocation)} style={{ position: 'absolute', left: 8, paddingTop: showTimerPopup ? 120 : 70, paddingHorizontal: 5 }}>
          <Icon name='street-view' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRerouteLocation(location?.coords)} style={{ position: 'absolute', left: 45, paddingTop: showTimerPopup ? 120 : 70, paddingHorizontal: 5 }}>
          <Icon name='route' type='font-awesome-5' size={32} color={GlobalColors.primary} />
        </TouchableOpacity>
        {payNow && <PayNowOverlay
          totalAmount={fare}
          host={driverData}
          riders={coriders}
          rideID={rideID} />}

        {isLoading ? (
          <ActivityIndicator style={{ padding: 25 }} size={"large"} color={GlobalColors.background} />
        ) :
          (<PanGestureHandler onGestureEvent={handleGestureEvent}>
            <Animated.View style={[styles.rideDetails, { height: rideDetailsHeight }]}>
              <View style={{ flexDirection: 'row' }}>
                <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                <Text style={styles.locationText}>From: {fromLocation?.name}</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                <Text style={styles.locationText}>To: {toLocation?.name}</Text>
              </View>
              {driverInfo && (
                <View style={styles.detailsAndFareContainer}>
                  {driverData?.profilePic ? (<Avatar rounded size="large" source={{ uri: driverData?.profilePic }} />)
                    : (
                      <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                      />)}
                  <View style={styles.detailsContainer}>
                    <Text style={styles.rideInfo}>{driverData?.name}</Text>
                    <Text style={[styles.rideInfo, { fontSize: 10 }]}>{driverInfo.make} {driverInfo.model}</Text>
                    <Text style={[styles.rideInfo, { fontSize: 15 }]}>{driverInfo.numberPlate}</Text>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" type="font-awesome" size={16} color="gold" />
                      <Text style={styles.rating}>{driverData?.rating}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.fare, { color: GlobalColors.primary }]}>Rs.{fare}</Text>
                    <View style={styles.callChatIcons}>
                      <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', driverData) }}>
                        <Icon style={styles.iconButton} name="comment-dots" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                      </TouchableOpacity>
                      {driverData?.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${driverData?.phoneNumber}`) }}>
                        <Icon style={styles.iconButton} name="phone-alt" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                      </TouchableOpacity>}
                    </View>
                  </View>
                </View>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
                <Text style={styles.cancelButtonText}>CANCEL RIDE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { coriders.length == 0 ? setRideDetailsHeight(290) : setRideDetailsHeight(280 + 70 * coriders.length) }}>
                <Text style={{ color: GlobalColors.primary, fontSize: 25, fontWeight: 'bold' }}>Co-Riders</Text>
              </TouchableOpacity>

              {coriders.map((corider, index) => (
                <View key={index} style={styles.detailsAndFareContainer}>
                  {corider?.profilePic ? <Avatar rounded size="large" source={{ uri: corider?.profilePic }} />
                    : (
                      <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                      />)}
                  <View style={styles.detailsContainer}>
                    <Text style={styles.rideInfo}>{corider.name}</Text>
                    <Text style={[styles.rideInfo, { fontSize: 10 }]}>{corider.gender === 0 ? 'Male' : 'Female'}</Text>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" type="font-awesome" size={16} color="gold" />
                      <Text style={styles.rating}>{corider.rating}</Text>
                    </View>
                  </View>
                  <View>
                    <View style={styles.callChatIcons}>
                      <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', corider) }}>
                        <Icon style={styles.iconButton} name="comment-dots" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                      </TouchableOpacity>
                      {corider.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${corider.phoneNumber}`) }}>
                        <Icon style={styles.iconButton} name="phone-alt" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                      </TouchableOpacity>}
                    </View>
                  </View>
                </View>
              ))}
              {coriders.length == 0 && <Text>No co-riders for this ride</Text>}
            </Animated.View>
          </PanGestureHandler>)}
      </GestureHandlerRootView>

    </>
  );
}


export default DuringRideScreen;