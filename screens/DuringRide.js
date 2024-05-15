import React, { Component, useEffect, useRef, useState } from 'react';
import { View, Text, Button, TouchableOpacity, Animated, Linking, ActivityIndicator } from 'react-native';
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
import { setLoading, setLocation, setRideDetails, setDistance, setDuration, setFromLocation, setToLocation, setFromRideLocation, setToRideLocation, setFare, setDriverInfo, setCoriders, setWayPoints } from '../context/actions/rideActions';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const DuringRideScreen = () => {
  const [payNow, setPayNow] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false);
  const [rideDetailsHeight, setRideDetailsHeight] = useState(280);
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
  const fromLocation = useSelector(state => state.ride.fromLocation);
  const toLocation = useSelector(state => state.ride.toLocation);
  const fromRideLocation = useSelector(state => state.ride.fromRideLocation);
  const toRideLocation = useSelector(state => state.ride.toRideLocation);
  const fare = useSelector(state => state.ride.fare);
  const driverInfo = useSelector(state => state.ride.driverInfo);
  const coriders = useSelector(state => state.ride.coriders);
  const wayPoints = useSelector(state => state.ride.wayPoints);
  const cancelledByMe = useSelector(state => state.ride.cancelledByMe);
  const navigation = useNavigation();
  const [driverData, setDriverData] = useState(null);
  const [rerouteLocation, setRerouteLocation] = useState(null);
  const dayIndexToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rideID = 'Ri5o1r474TkoTNC0XUZ6';//useRoute.params?.requestId;
  const mapRef = useRef();
  const location = useSelector(state => state.ride.location)
  const YOUR_TASK_NAME = 'background-location-task';
  const dispatch = useDispatch();
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const setTimer =()=> {
    setShowTimerPopup(true)
    const interval = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft === 0) {
          clearInterval(interval);
          return prevTimeLeft;
        }
        return prevTimeLeft - 1;
      });
    }, 1000);
    setShowTimerPopup(false)
    return () => clearInterval(interval);
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
      distanceInterval: 10, // Update every 10 meters
    };
    async function registerBackgroundFetchAsync() {
      return BackgroundFetch.registerTaskAsync(YOUR_TASK_NAME, {
        minimumInterval: 1 * 30, // task will fire 30 sec after app is backgrounded
      });
    }

    try {
      await Location.startLocationUpdatesAsync(YOUR_TASK_NAME, options);
      //  await registerBackgroundFetchAsync()
      console.log('Started receiving location updates.');
    } catch (error) {
      console.error('Error starting location updates:', error.message);
    }
  }

  const handleDirectionReady = (result) => {
    console.log(`Distance: ${result.distance} km`);
    console.log(`Duration: ${result.duration} min.`);
    dispatch(setDistance(result.distance.toFixed(2)));
    dispatch(setDuration(result.duration));
  };

  const adjustMapViewport = (coordinate1, coordinate2) => {
    console.log('map adj')
    let minLat, maxLat, minLng, maxLng = 0;
    console.log('o', location)
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
      console.log(maxLat)
      console.log(
        coordinate1.latitude,
        coordinate2.latitude,
        location.coords.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude)))
      console.log(
        coordinate1.latitude,
        coordinate2.latitude,
        location.coords.longitude,
        ...(wayPoints.map(wayPoint => wayPoint.longitude)))
      console.log('ok')
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
      console.log(maxLat)
      console.log(
        coordinate1.latitude,
        coordinate2.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.latitude)))
      console.log(
        coordinate1.latitude,
        coordinate2.latitude,
        ...(wayPoints.map(wayPoint => wayPoint.longitude)))
      console.log('ok')
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
      console.log('ok')
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
          setFromRideLocation(rideData.from)
          setToRideLocation(rideData.to)
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
              if(rider.rider==currentUser._id && !cancelledByMe){
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
        console.log('byie')
      });
      console.log('byoe')
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
        <View style={{ padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 14, color: GlobalColors.background, marginLeft:'auto'}}>Waiting Time: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}</Text>
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
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Current Location"
            />
          )}
          {toLocation && (
            <Marker
              coordinate={{
                latitude: toLocation.latitude,
                longitude: toLocation.longitude,
              }}
              title={'My Dropoff'}
              pinColor={GlobalColors.primary}
            />
          )}
          {fromLocation && (
            <Marker
              coordinate={{
                latitude: fromLocation.latitude,
                longitude: fromLocation.longitude,
              }}
              title={'My Pickup'}
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
        <TouchableOpacity onPress={() => adjustMapViewport(fromRideLocation, toRideLocation)} style={{ position: 'absolute', left: 45, paddingTop: 75, paddingHorizontal: 5 }}>
          <Icon name='street-view' type='font-awesome-5' size={30} color={GlobalColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRerouteLocation(location.coords)} style={{ position: 'absolute', left: 80, paddingTop: 75, paddingHorizontal: 5 }}>
          <Icon name='route' type='font-awesome-5' size={32} color={GlobalColors.primary} />
        </TouchableOpacity>
        {payNow && <PayNowOverlay
          totalAmount={fare}
          host={driverData}
          riders={coriders}
          rideID={rideID} />}
        {console.log('y', isLoading)}
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