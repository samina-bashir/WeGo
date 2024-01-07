import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { Icon, Input, Overlay } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import Checkbox from 'expo-checkbox';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const RequestCreationScreen = () => {
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [seats, setSeats] = useState(1);
    const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);
    const [isMusicModalVisible, setIsMusicModalVisible] = useState(false);
    const [hasVehicle, setHasVehicle] = useState(false);
    const [music, setMusic] = useState(false);
    const [gender, setGender] = useState(false);
    const [ac, setAC] = useState(false);
    const [location, setLocation] = useState(null);
    const [to, setTo] = useState({ latitude: 37.7749, longitude: -122.4194 });
    const [from, setFrom] = useState({ latitude: 34.0522, longitude: -118.2437 });
    const [route, setRoute] = useState(null);

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
    const VehicleIcon = ({ id, name, onPress }) => (
        <TouchableOpacity onPress={() => setSelectedVehicle(id)}>
            <View style={[styles.vehicleIconContainer, selectedVehicle == id && styles.vehicleInfo]}>
                <Icon name={name} type="font-awesome-5" size={40} color={GlobalColors.primary} style={{ paddingTop: 10 }} />
                <InfoIcon onPress={onPress} />
            </View>
        </TouchableOpacity>
    );
    const handleDirections = async () => {
        if (from && to) {
            const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
            const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${from?.latitude},${from.longitude}&destination=${to?.latitude},${to.longitude}&key=${apiKey}`;

            try {
                let response = await fetch(apiUrl);
                let result = await response.json();

                if (result.routes && result.routes.length > 0) {
                    const polyline = result.routes[0].overview_polyline.points;
                    setRoute(polyline);
                }
            } catch (error) {
                console.error('Error fetching directions:', error);
            }
        }
    };
    const InfoIcon = ({ onPress }) => (
        <TouchableOpacity onPress={onPress} style={styles.infoIconContainer}>
            <Icon name="info-circle" type="font-awesome" size={28} color={GlobalColors.secondary} />
        </TouchableOpacity>
    );
    const vehicles = [
        {
            id: 'bike',
            name: 'Bike',
            icon: 'motorcycle',
            details: 'Great for short trips. Enjoy the fresh air and freedom of two wheels.',
        },
        {
            id: 'ride-mini',
            name: 'Ride Mini',
            icon: 'car-alt',
            details: 'Compact and agile. Navigate city streets with ease and style.',
        },
        {
            id: 'ride',
            name: 'Ride',
            icon: 'car',
            details: 'Comfortable and spacious. Perfect for family outings and road trips.',
        },

        {
            id: 'suv',
            name: 'SUV',
            icon: 'shuttle-van',
            details: 'Spacious and powerful. Tackle any terrain with confidence and space for everyone.',
        },
    ];

    const toggleGenderModal = () => {
        setIsGenderModalVisible(!isGenderModalVisible);
    };

    const toggleMusicModal = () => {
        setIsMusicModalVisible(!isMusicModalVisible);
    };

    const showInfo = (vehicleId) => {
        setVehicleInfo(vehicleId);
    };

    const hideInfo = () => {
        setVehicleInfo(null);
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: location?.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.0925,
                    longitudeDelta: 0.0424,
                }}
            >
                {to && (
                    <Marker
                        coordinate={{
                            latitude: to?.latitude,
                            longitude: to.longitude,
                        }}
                        title="Destination"
                    />
                )}
                {location && (
                    <Marker
                        coordinate={{
                            latitude: location?.latitude,
                            longitude: location.longitude,
                        }}
                        title="You are here!"
                    />
                )}
                {handleDirections() || route && <Polyline coordinates={decodePolyline(route)} strokeWidth={4} />}
            </MapView>

            <View style={styles.formContainer}>
                <View style={styles.checkBoxContainer}>
                    <Checkbox
                        value={hasVehicle}
                        onValueChange={setHasVehicle}
                        color={GlobalColors.primary}
                    />
                    <Text style={styles.checkBoxLabel}>Offering your vehicle?</Text>
                </View>
                <View style={styles.vehiclesContainer}>
                    {vehicles.map((vehicle) => (
                        <VehicleIcon key={vehicle.id} id={vehicle.id} name={vehicle.icon} onPress={() => showInfo(vehicle.id)} />
                    ))}
                    <Overlay isVisible={vehicleInfo !== null} onBackdropPress={hideInfo} overlayStyle={{ margin: 10 }}>
                        {vehicleInfo && (
                            <View style={{ padding: 20 }}>
                                <Icon name={vehicles.find((v) => v.id === vehicleInfo).icon} type='font-awesome-5' color={GlobalColors.primary} />
                                <Text style={styles.heading}>{vehicles.find((v) => v.id === vehicleInfo).name}</Text>
                                <Text style={styles.text}>{vehicles.find((v) => v.id === vehicleInfo).details}</Text>
                            </View>
                        )}
                    </Overlay>
                </View>

                <View style={styles.inputContainer}>
                    <Icon name='map-marker' type='font-awesome' color={GlobalColors.primary} />
                    <Input
                        placeholder=" From"
                        inputContainerStyle={{ borderBottomWidth: 0 }}
                        containerStyle={{ flex: 1, paddingTop: 5, height: 50 }}
                        inputStyle={styles.input}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Icon name='search-location' type='font-awesome-5' color={GlobalColors.primary} />
                    <Input
                        placeholder="Where to?"
                        inputContainerStyle={{ borderBottomWidth: 0 }}
                        containerStyle={{ flex: 1, paddingTop: 5, height: 50 }}
                        inputStyle={styles.input}
                    />
                    <Icon name='clock-o' type='font-awesome' color={GlobalColors.primary} />
                </View>

                <View style={[styles.inputContainer, { justifyContent: 'space-between' }]}>
                    <Icon name='users' type='font-awesome-5' color={GlobalColors.primary} />
                    <Text style={[styles.label, { marginRight: 'auto', paddingHorizontal: 15 }]}>Seats of Vehicle</Text>
                    <View style={{ flexDirection: 'row', padding: 5 }}>
                        <Text style={styles.seatCount}>{seats}</Text>
                        <View style={styles.column}>
                            <TouchableOpacity onPress={() => setSeats(seats + 1)}>
                                <Icon name="caret-up" type="font-awesome" color={GlobalColors.primary} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setSeats(Math.max(1, seats - 1))}>
                                <Icon name="caret-down" type="font-awesome" color={GlobalColors.primary} size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Icon name="money-bill-wave" type="font-awesome-5" color={GlobalColors.primary} />
                    <Input
                        placeholder="Offer your Fare"
                        inputContainerStyle={{ borderBottomWidth: 0 }}
                        containerStyle={{ flex: 1, height: 50, paddingTop: 5 }}
                        inputStyle={styles.input}
                    />
                </View>

                <Text style={[styles.label, styles.preferableRequirements]}>Preferable Requirements</Text>
                <View style={[styles.container, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                    <View style={styles.checkBoxContainer}>
                        <Checkbox value={ac} onValueChange={setAC} color={GlobalColors.primary} />
                        <Text style={[styles.label, { paddingHorizontal: 10 }]}>AC</Text>
                    </View>
                    <View style={styles.checkBoxContainer}>
                        <Checkbox value={gender} onValueChange={setGender} onPress={toggleGenderModal} color={GlobalColors.primary} />
                        <Text style={[styles.label, { paddingHorizontal: 10 }]}>Gender</Text>
                    </View>
                    <View style={styles.checkBoxContainer}>
                        <Checkbox value={music} onValueChange={setMusic} onPress={toggleMusicModal} color={GlobalColors.primary} />
                        <Text style={[styles.label, { paddingHorizontal: 10 }]}>Music</Text>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: GlobalColors.primary }]}
                        onPress={() => {
                            // Handle the "Find a host" action
                        }}
                    >
                        <Text style={styles.buttonText}>Find a Host</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: GlobalColors.secondary }]}
                        onPress={() => {
                            // Handle the "Find a rider" action
                        }}
                    >
                        <Text style={styles.buttonText}>Find a Rider</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Overlay isVisible={isGenderModalVisible} onBackdropPress={toggleGenderModal}>
                <View>
                    <Text>Gender Preferences</Text>
                    {/* Add content for gender preferences */}
                </View>
            </Overlay>

            <Overlay isVisible={isMusicModalVisible} onBackdropPress={toggleMusicModal}>
                <View>
                    <Text>Music Preferences</Text>
                    {/* Add content for music preferences */}
                </View>
            </Overlay>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: windowWidth,
        height: windowHeight * 0.4,
    },
    formContainer: {
        flex: 2,
        padding: 12,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    vehiclesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    vehicleInfo: {
        backgroundColor: GlobalColors.secondary,
    },
    vehicleIconContainer: {
        alignItems: 'center',
        borderRadius: 15,
        borderWidth: 2,
        margin: 3,
        padding: 10,
        width: windowWidth * 0.21,
        backgroundColor: GlobalColors.background
    },
    infoIconContainer: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    inputText: {
        fontSize: 16,
        padding: 5,
    },
    seatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    column: {
        flexDirection: 'column',
    },
    seatCount: {
        fontSize: 20,
        margin: 3,
        paddingHorizontal: 10,
        paddingVertical: 1,
        borderRadius: 5,
        backgroundColor: GlobalColors.secondary,
        color: GlobalColors.background
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 10,
        marginHorizontal: 2,
    },
    buttonText: {
        color: GlobalColors.background,
        fontSize: 18,
    },
    preferableRequirements: {
        fontWeight: 'bold',
        fontSize: 18,
        color: GlobalColors.primary
    },
    checkBoxContainer: {
        padding: 5,
        flexDirection: 'row',
    },
    checkBoxLabel: {
        fontSize: 16,
        paddingHorizontal: 15
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 15,
        marginBottom: 10
    },
    input: {
        flex: 1,
        marginLeft: 10,
        paddingVertical: 0,
        marginVertical: 1,
    },
    text: {
        textAlign: 'center',
        fontSize: 15,
        padding: 10,
    },
    heading: {
        color: GlobalColors.primary,
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        margin: 10
    }

});

export default RequestCreationScreen;
