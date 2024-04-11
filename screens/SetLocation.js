import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, KeyboardAvoidingView, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import GlobalColors from '../styles/globalColors';

const SetLocationScreen = () => {
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);

  const onFromLocationSelect = (data, details) => {
    // Handle selection of "From" location
    setFromLocation({
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: data.description
    });
  };

  const onToLocationSelect = (data, details) => {
    // Handle selection of "To" location
    setToLocation({
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: data.description
    });
  };

  return (
    <View style={styles.container}>
        <ScrollView>
        <KeyboardAvoidingView>
      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="From"
          onPress={onFromLocationSelect}
          fetchDetails={true}
          currentLocation={true}
          keepResultsAfterBlur={true}
          enablePoweredByContainer={false}
          GooglePlacesSearchQuery={{rankby: 'distance'}}
          query={{
            key: 'AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8',
            language: 'en',
            components: 'country:pk'
          }}
          styles={{
            textInputContainer: {
              backgroundColor: GlobalColors.background,
              borderTopWidth: 0,
              borderBottomWidth: 0
            },
            textInput: {
              marginLeft: 0,
              marginRight: 0,
              height: 38,
              color: '#5d5d5d',
              fontSize: 16
            },
            predefinedPlacesDescription: {
              color: '#1faadb'
            }
          }}
        />
        <GooglePlacesAutocomplete
          placeholder="To"
          onPress={onToLocationSelect}
          fetchDetails={true}
          currentLocation={true}
          keepResultsAfterBlur={true}
          enablePoweredByContainer={false}
          GooglePlacesSearchQuery={{rankby: 'distance'}}
          query={{
            key: 'AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8',
            language: 'en',
            components: 'country:pk'
          }}
          styles={{
            textInputContainer: {
              backgroundColor:GlobalColors.background,
              borderTopWidth: 0,
              borderBottomWidth: 0
            },
            textInput: {
              marginLeft: 0,
              marginRight: 0,
              height: 38,
              color: '#5d5d5d',
              fontSize: 16
            },
            predefinedPlacesDescription: {
              color: '#1faadb'
            }
          }}
        />
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        provider='google'
      >
        {fromLocation && (
          <Marker
            coordinate={{
              latitude: fromLocation.latitude,
              longitude: fromLocation.longitude
            }}
            title={fromLocation.name}
          />
        )}
        {toLocation && (
          <Marker
            coordinate={{
              latitude: toLocation.latitude,
              longitude: toLocation.longitude
            }}
            title={toLocation.name}
          />
        )}
      </MapView>
      </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop:40,
    backgroundColor:'red'
  },
  autocompleteContainer: {
    width: '100%',
    marginVertical: 0,
    backgroundColor:'black'
  },
  map: {
    marginTop:'auto',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 100,
  },
});

export default SetLocationScreen;
