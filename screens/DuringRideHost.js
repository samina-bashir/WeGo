import React, { useState, useEffect } from 'react';
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
import { useSelector } from 'react-redux';

const DuringRideHost = () => {
  const [showFeedback, setShowFeedback]= useState(false)
  const [isLoading, setIsLoading]= useState(false)
  const [isMapReady, setIsMapReady] = useState(false);
  const [rideDetailsHeight, setRideDetailsHeight] = useState(200);

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
  const [riders, setRiders] = useState([]);
  const rideID = useRoute().params?.requestId;

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
            console.log(rideData)
            setFromLocation(rideData.from);
            setToLocation(rideData.to);

          

            const ridersData = [];
            for (const rider of rideData.Riders) {
              if (rider.rider !== currentUser._id) {
                const riderDocRef = doc(collection(firestoreDB, 'users'), rider.rider);
                try {
                  const riderSnapshot = await getDoc(riderDocRef);
                  const riderData = riderSnapshot.data();
                  if (riderData) {
                    ridersData.push(riderData);
                  } else {
                    console.error(`Rider data not found for rider ID: ${rider.rider}`);
                  }
                } catch (error) {
                  console.error('Error fetching rider data:', error);
                }
              }
            }
            setRiders(ridersData);
          } catch (error) {
            console.error('Error processing ride data:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up snapshot listener:', error);
      }
      console.log('Done Fetching')
      setIsLoading(false)
    };

    fetchData();
  }, []);


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

  const handleMapReady = () => {
    setIsMapReady(false);
  };

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
        <TouchableOpacity onPress={()=>{setShowFeedback(true)}}>
        <Text style={{fontSize:25, color: GlobalColors.background, marginLeft: 'auto', paddingHorizontal:10}}>Feedback</Text>
        </TouchableOpacity>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          followsUserLocation
          onMapReady={handleMapReady}
        >
          {isMapReady && (
            <>
          <Marker
            coordinate={{ latitude: 31.484787, longitude: 74.298013 }}
            title="Your Location"
            description="This is where you are"
          />
          
            <MapViewDirections
              origin={initialRegion}
              destination={destination}
              apikey="YOUR_GOOGLE_MAPS_API_KEY"
              strokeWidth={4}
              strokeColor="blue"
            />
            </>
          )}
        </MapView>
        {isLoading ? (
          <ActivityIndicator size={"large"} color={GlobalColors.primary} />
        ):
       ( <PanGestureHandler onGestureEvent={handleGestureEvent}>
          <Animated.View style={[styles.rideDetails, { height: rideDetailsHeight }]}>
            <View style={{ flexDirection: 'row' }}>
              <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
              <Text style={styles.locationText}> From: {fromLocation} </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
              <Text style={styles.locationText}> To: {toLocation} </Text>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
              <Text style={styles.cancelButtonText}>CANCEL RIDE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRideDetailsHeight(200 + 70 * riders.length) }}>
              <Text style={{ color: GlobalColors.primary, fontSize: 25, fontWeight: 'bold' }}>Riders</Text>
            </TouchableOpacity>

            {riders.map((rider, index) => (
              <View key={index} style={styles.detailsAndFareContainer}>
                {rider?.profilePic ? <Avatar rounded size="large" source={{ uri: rider?.profilePic }} />
                  : (
                    <Avatar rounded size="large" source={require('../assets/avatar.jpg')}
                    />)}
                <View style={styles.detailsContainer}>
                  <Text style={styles.rideInfo}>{rider.name}</Text>
                  <Text style={[styles.rideInfo, { fontSize: 10 }]}>{rider.gender === 0 ? 'Male' : 'Female'}</Text>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" type="font-awesome" size={16} color="gold" />
                    <Text style={styles.rating}>{rider.rating}</Text>
                  </View>
                </View>
                <View>
                  <View style={styles.callChatIcons}>
                    <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', rider) }}>
                      <Icon style={styles.iconButton} name="comment-dots" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                    </TouchableOpacity>
                    {rider.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${rider.phoneNumber}`) }}>
                      <Icon style={styles.iconButton} name="phone-alt" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                    </TouchableOpacity>}
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        </PanGestureHandler>)}
      </GestureHandlerRootView>
      {showFeedback && <FeedbackHost riders={riders} visible={true} />}
    </>
  );
}

export default DuringRideHost;
