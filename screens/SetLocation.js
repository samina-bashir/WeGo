import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import GlobalColors from '../styles/globalColors';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useRef } from 'react';
import { Icon } from 'react-native-elements';
import axios from 'axios';

const SetLocationScreen = ({ onLocationSet }) => {
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null)
  const [fromDraggedLocation, setFromDraggedLocation] = useState(null);
  const [toDraggedLocation, setToDraggedLocation] = useState(null)
  const [location, setLocation] = useState(null)
  const [selectFromMapMode, setSelectFromMapMode] = useState(false);
  const fromRef = useRef();
  const toRef = useRef();
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted');
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation(coords);

    })();
  }, []);

  const adjustMapViewport = (coordinate1, coordinate2) => {
    if (coordinate1 && coordinate2) {
      const minLat = Math.min(coordinate1.latitude, coordinate2.latitude);
      const maxLat = Math.max(coordinate1.latitude, coordinate2.latitude);
      const minLng = Math.min(coordinate1.longitude, coordinate2.longitude);
      const maxLng = Math.max(coordinate1.longitude, coordinate2.longitude);

      const padding = 50; // Adjust the padding as needed

      // Adjust map viewport to fit the bounding box
      mapRef.current.fitToCoordinates(
        [
          { latitude: minLat, longitude: minLng },
          { latitude: maxLat, longitude: maxLng },
        ],
        {
          edgePadding: {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding,
          },
          animated: true,
        }
      )
    };
  };

  const onFromLocationSelect = (data, details) => {
    // Handle selection of "From" location
    setFromLocation({
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: data.description
    });
    fromRef.current?.setAddressText(data.description);

  };

  const onToLocationSelect = (data, details) => {
    // Handle selection of "To" location
    setToLocation({
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: data.description
    });
    toRef.current?.setAddressText(data.description);
  };

  const onMarkerDragEnd = (coordinate, type) => {
    if (type === 'from') {
      setFromDraggedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: 'Pickup Location'
      });
    } else {
      setToDraggedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: 'Dropoff Location'
      });
    }

  };

  useEffect(() => {
    const from = fromDraggedLocation || fromLocation;
    const to = toDraggedLocation || toLocation
    adjustMapViewport(from, to)
  }, [fromDraggedLocation, toDraggedLocation]);

  useEffect(() => {
    adjustMapViewport(fromLocation, toLocation)
  }, [fromLocation, toLocation]);

  const toggleSelectFromMapMode = () => {
    if (selectFromMapMode) {
      setFromDraggedLocation(null)
      setToDraggedLocation(null)
    } else {
      if (!fromLocation)
        setFromDraggedLocation({ latitude: location.latitude, longitude: location.longitude, name: 'Pickup Location' })
      else
        setFromDraggedLocation({ latitude: fromLocation.latitude, longitude: fromLocation.longitude, name: 'Pickup Location' })
      if (!toLocation)
        setToDraggedLocation({ latitude: location.latitude + 0.002, longitude: location.longitude + 0.003, name: 'Dropoff Location' })
      else
        setToDraggedLocation({ latitude: toLocation.latitude, longitude: toLocation.longitude, name: 'Dropoff Location' })

    }
    setSelectFromMapMode(!selectFromMapMode);
    setFromLocation(null)
    setToLocation(null)
  };

  const onPressSetLocation = async () => {
    if (!selectFromMapMode) {
      if (!fromLocation || !toLocation) {
        alert('Please select both pickup and dropoff locations.');
        return;
      }
      if (fromLocation.name == 'Current Location') {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${fromLocation.latitude},${fromLocation.longitude}&key=AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8`
          );
          console.log(response.data)
          // Parse the response and extract the formatted address
          fromLocation.name = response.data?.results[0]?.formatted_address;
          console.log(fromLocation.name);
        } catch (error) {
          console.error('Error fetching address:', error);
        }
      }
      if (toLocation.name == 'Current Location') {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${toLocation.latitude},${toLocation.longitude}&key=AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8`
          );
          console.log(response.data)
          // Parse the response and extract the formatted address
          toLocation.name = response.data?.results[0]?.formatted_address;
          console.log(toLocation.name);
        } catch (error) {
          console.error('Error fetching address:', error);
        }
      }
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append(
        "X-Goog-Api-Key",
        "AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8"
      );
      myHeaders.append(
        "X-Goog-FieldMask",
        "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
      );

      const raw =
        `{origin:{location: {latLng: {latitude: ${fromLocation.latitude}, longitude: ${fromLocation.longitude}}}},  destination: {    location: {     latLng: {        latitude: ${toLocation.latitude},       longitude: ${toLocation.longitude}          }      }   },  travelMode: "DRIVE",  routingPreference: "TRAFFIC_AWARE", computeAlternativeRoutes: true,  languageCode: "en-US",  units: "IMPERIAL"}`;

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          // alert(result)
          console.log(result);
         // alert(result.routes[0].distanceMeters)
         onLocationSet(fromLocation, toLocation, result.routes[0].distanceMeters, result.routes[0].duration)
        })
    
    }
    if (selectFromMapMode) {
      if (!fromDraggedLocation || !toDraggedLocation) {
        alert('Please select both pickup and dropoff locations.');
        return;
      }

      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${fromDraggedLocation.latitude},${fromDraggedLocation.longitude}&key=AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8`
        );
        console.log(response.data)
        // Parse the response and extract the formatted address
        fromDraggedLocation.name = response.data?.results[0]?.formatted_address;
        console.log(fromDraggedLocation.name);
      } catch (error) {
        console.error('Error fetching address:', error);
      }
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${toDraggedLocation.latitude},${toDraggedLocation.longitude}&key=AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8`
        );
        console.log(response.data)
        // Parse the response and extract the formatted address
        toDraggedLocation.name = response.data?.results[0]?.formatted_address;
        console.log(toDraggedLocation.name);
      } catch (error) {
        console.error('Error fetching address:', error);
      }
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append(
        "X-Goog-Api-Key",
        "AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8"
      );
      myHeaders.append(
        "X-Goog-FieldMask",
        "routes.duration,routes.distanceMeters"
      );

      const raw =
        `{origin:{location: {latLng: {latitude: ${fromDraggedLocation.latitude}, longitude: ${fromDraggedLocation.longitude}}}},  destination: {    location: {     latLng: {        latitude: ${toDraggedLocation.latitude},       longitude: ${toDraggedLocation.longitude}          }      }   },  travelMode: "DRIVE",  routingPreference: "TRAFFIC_AWARE", computeAlternativeRoutes: false,  languageCode: "en-US",  units: "IMPERIAL"}`;

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          // alert(result)
          console.log(result);
          //alert(result.routes[0].distanceMeters)
         // alert(result.routes[0].duration)
         onLocationSet(fromDraggedLocation, toDraggedLocation, result.routes[0].distanceMeters,result.routes[0].duration)
        })
      
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps='always'>
        <KeyboardAvoidingView>
          <View style={styles.autocompleteContainer}>
            {!selectFromMapMode ? (<><GooglePlacesAutocomplete
              placeholder="Pickup Location"
              ref={fromRef}
              predefinedPlacesAlwaysVisible={true}
              enableHighAccuracyLocation={true}
              textInputProps={{ clearButtonMode: 'while-editing' }}
              predefinedPlaces={[
                {
                  description: 'Current Location',
                  geometry: { location: { lat: location?.latitude, lng: location?.longitude } },
                }
              ]}
              onPress={onFromLocationSelect}
              onClear={() => setFromLocation(null)}
              fetchDetails={true}
              autoFocus={false}
              enablePoweredByContainer={false}
              GooglePlacesSearchQuery={{
                rankby: 'distance',
                location: `${location?.latitude}, ${location?.longitude}`
              }}
              query={{
                key: 'AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8',
                language: 'en',
                components: 'country:pk'
              }}
              styles={{
                textInputContainer: {
                  backgroundColor: GlobalColors.background
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
                placeholder="Dropoff Location"
                ref={toRef}
                predefinedPlacesAlwaysVisible={true}
                enableHighAccuracyLocation={true}
                predefinedPlaces={[
                  {
                    description: 'Current Location',
                    geometry: { location: { lat: location?.latitude, lng: location?.longitude } },
                  }
                ]}
                onPress={onToLocationSelect}
                onClear={() => setToLocation(null)}
                fetchDetails={true}
                keepResultsAfterBlur={false}
                enablePoweredByContainer={false}
                GooglePlacesSearchQuery={{
                  rankby: 'distance',
                  location: `${location?.latitude}, ${location?.longitude}`
                }}
                query={{
                  key: 'AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8',
                  language: 'en',
                  components: 'country:pk',
                  location: `${location?.latitude}, ${location?.longitude}`
                }}
                styles={{
                  textInputContainer: {
                    backgroundColor: GlobalColors.background,
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
              /></>) : null}
            {!selectFromMapMode ? (<TouchableOpacity onPress={toggleSelectFromMapMode} style={styles.selectFromMapButton}>
              <Icon name='map-pin' type='font-awesome-5' size={18} color={GlobalColors.primary} />
              <Text style={{ marginHorizontal: 5, fontSize: 16 }}>Select from Map</Text>
            </TouchableOpacity>) : (<TouchableOpacity onPress={toggleSelectFromMapMode} style={styles.selectFromMapButton}>
              <Icon name='search-location' type='font-awesome-5' size={18} color={GlobalColors.primary} />
              <Text style={{ marginHorizontal: 5, fontSize: 16 }}>Search</Text>
            </TouchableOpacity>)}
          </View>
          <MapView
            style={[
              styles.map,
              selectFromMapMode ? { height: Dimensions.get('window').height - 50 } : { height: Dimensions.get('window').height - 130 }
            ]}
            ref={mapRef}
            initialRegion={{
              latitude: 31.48478,
              longitude: 74.298013,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            provider='google'

          >
            {fromLocation ? (
              <Marker
                coordinate={{
                  latitude: fromLocation?.latitude,
                  longitude: fromLocation?.longitude
                }}
                title={fromLocation.name}
              />
            ) : null}
            {toLocation ? (
              <Marker
                coordinate={{
                  latitude: toLocation?.latitude,
                  longitude: toLocation?.longitude
                }}
                title={toLocation.name}
                pinColor={GlobalColors.primary}
              />
            ) : null}
            {fromDraggedLocation ? (
              <Marker
                coordinate={{
                  latitude: fromDraggedLocation?.latitude,
                  longitude: fromDraggedLocation?.longitude
                }}
                title={fromDraggedLocation.name}
                draggable={true}
                onDragEnd={(e) => onMarkerDragEnd(e.nativeEvent.coordinate, 'from')}
              />
            ) : null}
            {toDraggedLocation ? (
              <Marker
                coordinate={{
                  latitude: toDraggedLocation?.latitude,
                  longitude: toDraggedLocation?.longitude
                }}
                title={toDraggedLocation.name}
                pinColor={GlobalColors.primary}
                draggable={true}
                onDragEnd={(e) => onMarkerDragEnd(e.nativeEvent.coordinate, 'to')}
              />
            ) : null}
          </MapView>
          <TouchableOpacity style={styles.setScheduleButton} onPress={onPressSetLocation}>
            <Text style={styles.setScheduleButtonText}>Set Location</Text>
          </TouchableOpacity>
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
    paddingTop: 40,
  },
  autocompleteContainer: {
    width: '100%',
    marginVertical: 0,
  },
  map: {
    marginTop: 'auto',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 130,
  },
  setScheduleButton: {
    backgroundColor: GlobalColors.primary,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5,
    width: '95%',
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  setScheduleButtonText: {
    color: GlobalColors.background,
    fontSize: 18,
    textAlign: 'center'
  },
  selectFromMapButton: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 3
  }
});

export default SetLocationScreen;
