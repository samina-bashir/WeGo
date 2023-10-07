import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import styles from '../styles/globalStyles';

class DuringRideScreen extends Component {
  state = {
      initialRegion: {
        latitude: 31.480864, // Initial latitude (FAST-NUCES Lahore)
        longitude: 74.303114, // Initial longitude (FAST-NUCES Lahore)
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      destination: 
        { latitude: 31.484787, longitude: 74.298013 }, // Jinnah hospital
      isMapReady: false, // New state to track map readiness
    };
  
    handleMapReady = () => {
      this.setState({ isMapReady: true });
    };
  
    render() {
      const { isMapReady } = this.state;
  
      return (
        <View style={styles.container}>
          <MapView
            style={styles.map}
            initialRegion={this.state.initialRegion}
            showsUserLocation
            followsUserLocation
            onMapReady={this.handleMapReady} // Set the onMapReady callback
          >
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
        <View style={styles.header}>
          {/* Display driver's information, status, and buttons here */}
          <Text>Driver: John Doe</Text>
          <Text>ETA: 5 minutes</Text>
          <Button title="Call Driver" />
          <Button title="End Ride" />
        </View>
        <View style={styles.chat}>
          {/* Implement in-app chat component */}
          {/* Example: <ChatComponent driverId={/* driver's ID */} 
        </View>
      </View>
    );
  }
}

export default DuringRideScreen;
