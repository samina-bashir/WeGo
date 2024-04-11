import React, { Component, useEffect, useState } from 'react';
import { View, Text, Button, TouchableOpacity, Animated, Linking, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import styles from '../styles/globalStyles';
import { Icon, Overlay, Rating, Avatar, Input } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import Feedback from '../components/Feedback';
import PayNowOverlay from '../components/PayNow';
import { useNavigation, useRoute } from '@react-navigation/native';
import { firestoreDB } from '../config/firebase.config';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { useSelector } from 'react-redux';

const DuringRideScreen = () => {
  const [payNow, setPayNow]= useState(false)
  const [isMapReady, setIsMapReady] = useState(false);
  const [rideDetailsHeight, setRideDetailsHeight] = useState(280);
  const [isLoading, setIsLoading]= useState(true)
  const initialRegion = {
    latitude: 31.480864,
    longitude: 74.303114,
    latitudeDelta: 0.0102,
    longitudeDelta: 0.0101,
  };
  const currentUser = useSelector((state) => state.user.user);
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [fare, setFare] = useState(null);
  const destination = { latitude: 31.484787, longitude: 74.298013 };
  const navigation = useNavigation();
  const [driverInfo, setDriverInfo] = useState(null);
  const [coriders, setCoriders] = useState([]);
  const [driverData, setDriverData] = useState(null);
  const rideID = useRoute.params?.requestId;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const rideDocRef = doc(collection(firestoreDB, 'ride'), 'Ri5o1r474TkoTNC0XUZ6');
        const unsubscribe = onSnapshot(rideDocRef, async (rideSnapshot) => {
          try {
            const rideData = rideSnapshot.data();
            if (!rideData) {
              console.error('Ride data is null or undefined.');
              return;
            }
            console.log('Ride data:', rideData);
            setFromLocation(rideData.from);
            setToLocation(rideData.to);

            const currentUserRider = rideData.Riders.find(rider => rider.rider === currentUser._id);
            if (!currentUserRider) {
             // console.error('Current user rider data not found in ride.');
           //   return;
            }
            setFare(250);
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
            setDriverInfo(driverInfoData);
            // Set the userData state
            setDriverData(userData);
            const coridersData = [];
            for (const rider of rideData.Riders) {
              if (rider.rider !== currentUser._id) {
                const riderDocRef = doc(collection(firestoreDB, 'users'), rider.rider);
                try {
                  const riderSnapshot = await getDoc(riderDocRef);
                  const riderData = riderSnapshot.data();
                  if (riderData) {
                    coridersData.push(riderData);
                  } else {
                    console.error(`Rider data not found for rider ID: ${rider.rider}`);
                  }
                } catch (error) {
                  console.error('Error fetching rider data:', error);
                }
              }
            }
            setCoriders(coridersData);
          } catch (error) {
            console.error('Error processing ride data:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up snapshot listener:', error);
      }
      setIsLoading(false)
    };

    fetchData();
  }, []);

  const cancelRide = async () => {
    try {
      const rideRef = doc(collection(firestoreDB, 'ride'), rideID);
      const rideSnapshot = await getDoc(rideRef);
      const rideData = rideSnapshot.data();
      const currentUserIndex = rideData.Riders.findIndex(rider => rider.rider === currentUser._id);

      if (currentUserIndex !== -1) {
        const updatedRiders = [...rideData.Riders];
        updatedRiders[currentUserIndex].status = "Cancelled";
        await updateDoc(rideRef, { Riders: updatedRiders });

      } else {
        console.error("Current user is not a rider in this ride.");
      }

      console.log('Ride status updated successfully to "cancelled"');
      const userRef = doc(collection(firestoreDB, 'users'), currentUser._id);
      await updateDoc(userRef, { cancelledRides: currentUser.cancelledRides + 1, fareDue:false });

      navigation.navigate('RequestCreation')
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const handleMapReady = () => {
    setIsMapReady(false);
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

  return (
    <>
      <GestureHandlerRootView style={styles.container}>
        <TouchableOpacity onPress={()=>setPayNow(true)}>
          <Text style={{fontSize:25, color: GlobalColors.background, marginLeft: 'auto',paddingHorizontal:10}}>Pay Now</Text>
        </TouchableOpacity>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          followsUserLocation
          onMapReady={handleMapReady} // Set the onMapReady callback
        >
          <Marker
            coordinate={{ latitude: 31.484787, longitude: 74.298013 }}
            title="Your Location"
            description="This is where you are"
          />
          {isMapReady && ( // Render the directions only when the map is ready
            <MapViewDirections
              origin={initialRegion}
              destination={destination}
              apikey="YOUR_GOOGLE_MAPS_API_KEY"
              strokeWidth={4}
              strokeColor="blue"
            />
          )}
        </MapView>

        {payNow && <PayNowOverlay
          totalAmount={fare}
          host={driverData}
          riders={coriders}
          rideID={rideID} />}
        {isLoading ? (
          <ActivityIndicator size={"large"} color={GlobalColors.primary} />
        ):
        (<PanGestureHandler onGestureEvent={handleGestureEvent}>
          <Animated.View style={[styles.rideDetails, { height: rideDetailsHeight }]}>
            <View style={{ flexDirection: 'row' }}>
              <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
              <Text style={styles.locationText}>From: {fromLocation}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
              <Text style={styles.locationText}>To: {toLocation}</Text>
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
            <TouchableOpacity onPress={() => { setRideDetailsHeight(280 + 70 * coriders.length) }}>
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
          </Animated.View>
        </PanGestureHandler>)}
      </GestureHandlerRootView>

    </>
  );
}


export default DuringRideScreen;