import React, { Component } from 'react';
import { View, Text, Button, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import styles from '../styles/globalStyles';
import { Icon, Overlay, Rating, Avatar, Input } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import Feedback from '../components/Feedback';

class DuringRideScreen extends Component {

  state = {
    initialRegion: {
      latitude: 31.480864, // Initial latitude (FAST-NUCES Lahore)
      longitude: 74.303114, // Initial longitude (FAST-NUCES Lahore)
      latitudeDelta: 0.0102,
      longitudeDelta: 0.0101,
    },
    destination:
      { latitude: 31.484787, longitude: 74.298013 }, // Jinnah hospital
    isMapReady: false, // New state to track map 
    rideDetailsHeight: 250,
  };

  handleMapReady = () => {
    this.setState({ isMapReady: false });
  };
  handleGestureEvent = (event) => {
    const { rideDetailsHeight } = this.state;
    if (event.nativeEvent.state === State.ACTIVE) {
      const offsetY = -1*event.nativeEvent.translationY;
      var newHeight = rideDetailsHeight + offsetY;
      // Ensure the ride details cannot be completely closed or exceed a certain height
      if (newHeight <= 300){
        newHeight=300
      }
      else if (newHeight >= 700){
        newHeight=700
      }
      if (newHeight >= 250 && newHeight <= 700) {
        this.setState({ rideDetailsHeight: newHeight });
      }
    }
  };

  render() {
    const { isMapReady } = this.state;
    const fromLocation = 'Fast Nuces Lahore';
    const toLocation = 'Jinnah Hospital';
    const vehicleRegNumber = 'LZT 6505';
    const driverName = 'Noor Fatimah';
    const carModel = 'Sedan';
    const rating = 4.5;
    const fare = '50.00';
    const { rideDetailsHeight } = this.state;
    const dummyNames = ['Ali', 'Sara'];
    const dummyFare = ['50', '70'];
    const feedback = 'Excellent service!';

    return (
      <>
        <GestureHandlerRootView style={styles.container}>
          <MapView
            style={styles.map}
            initialRegion={this.state.initialRegion}
            showsUserLocation
            followsUserLocation
            onMapReady={this.handleMapReady} // Set the onMapReady callback
          >
            <Marker
              coordinate={{ latitude: 31.480864, longitude: 74.303114 }}
              title="Your Location"
              description="This is where you are"
            />
            <Marker
              coordinate={{ latitude: 31.484787, longitude: 74.298013 }}
              title="Your Location"
              description="This is where you are"
            />
            {isMapReady && ( // Render the directions only when the map is ready
              <MapViewDirections
                origin={this.state.initialRegion}
                destination={this.state.destination}
                apikey="YOUR_GOOGLE_MAPS_API_KEY"
                strokeWidth={4}
                strokeColor="blue"
              />
            )}
          </MapView>
          <Feedback names={dummyNames} fare={dummyFare} />
          <PanGestureHandler onGestureEvent={this.handleGestureEvent}>
            <Animated.View
              style={[styles.rideDetails, { height: rideDetailsHeight }]}
            >
              <View style={styles.drawerIndicator} />
              <Text style={styles.locationText}>From: {fromLocation}</Text>
              <Text style={styles.locationText}>To: {toLocation}</Text>

              <View style={styles.detailsAndFareContainer}>
                <Avatar
                  rounded
                  size="large"
                  source={require('../assets/avatar.jpg')} // Replace with your image
                />
                <View style={styles.detailsContainer}>
                  <Text style={styles.rideInfo}>{driverName}</Text>
                  <Text style={[styles.rideInfo, { fontSize: 10 }]}>{carModel}</Text>
                  <Text style={[styles.rideInfo, { fontSize: 15 }]}>{vehicleRegNumber}</Text>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" type="font-awesome" size={16} color="gold" />
                    <Text style={styles.rating}>{rating}</Text>
                  </View>
                </View>
                <View>
                  <Text style={[styles.fare, { color: GlobalColors.primary }]}>Rs.{fare}</Text>
                  <View style={styles.callChatIcons}>
                    <Icon style={styles.iconButton} name="comment-dots" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                    <Icon style={styles.iconButton} name="phone-alt" type="font-awesome-5" size={25} color={GlobalColors.primary} />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
              
            </Animated.View>
          </PanGestureHandler>
        </GestureHandlerRootView>
        
      </>
    );
  }
}

export default DuringRideScreen;
