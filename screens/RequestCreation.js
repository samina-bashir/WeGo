import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Icon, Input, Overlay } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import Checkbox from 'expo-checkbox';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Timestamp, addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { Modal } from 'react-native';
import SetSchedule from './SetSchedule';
import Menu from '../components/Menu';
import MyRequests from './MyRequests';
import { useSelector } from 'react-redux';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const RequestCreationScreen = () => {
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [userVehicleType, setUserVehicleType] = useState(null);
    const [seats, setSeats] = useState(1);
    const [hasVehicle, setHasVehicle] = useState(false);
    const [music, setMusic] = useState(false);
    const [gender, setGender] = useState(false);
    const [ac, setAC] = useState(false);
    const [fare, setFare] = useState(false);
    const [location, setLocation] = useState(null);
    const [to, setTo] = useState(null);
    const [from, setFrom] = useState(null);
    const [route, setRoute] = useState(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const navigation = useNavigation();
    const [fromError, setFromError] = useState('');
    const [toError, setToError] = useState('');
    const [fareError, setFareError] = useState('');
    const [seatsError, setSeatsError] = useState('');
    const [vehicleError, setVehicleError] = useState('');
    const [isDropDownVisible, setIsDropDownVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState('Now');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [roundTrip, setRoundTrip] = useState(true);
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [rawSchedule, setRawSchedule] = useState(
        Array(7).fill({
            Earliest: '08:00', // Default earliest pickup time at 8:00 AM
            Other: '10:00',    // Default other pickup time at 12:00 PM
            Return: '16:00',   // Default return pickup time at 4:00 PM
            'Return Dropoff': '18:00', // Default return dropoff time at 8:00 PM
            enabled: true
        })
    );
    const [schedule, setSchedule] = useState(null);

    const currentUser = useSelector((state) => state.user.user);

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
        <TouchableOpacity onPress={() => setSelectedVehicle(id)} disabled={hasVehicle}>
            <View style={[styles.vehicleIconContainer, selectedVehicle == id && styles.vehicleInfo]}>
                <Icon name={name} type="font-awesome-5" size={40} color={GlobalColors.primary} style={{ paddingTop: 10 }} />
                <InfoIcon onPress={onPress} />
            </View>
        </TouchableOpacity>
    );
    const handleDirections = async () => {
        if (from && to) {
            const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
            const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${from?.latitude},${from?.longitude}&destination=${to?.latitude},${to?.longitude}&key=${apiKey}`;

            try {
                let response = await fetch(apiUrl);
                let result = await response.json();

                if (result.routes && result.routes?.length > 0) {
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

    const showInfo = (vehicleId) => {
        setVehicleInfo(vehicleId);
    };

    const hideInfo = () => {
        setVehicleInfo(null);
    };

    const validateFrom = () => {
        if (!from) {
            setFromError('Please enter a valid starting location.');
            return false;
        }
        setFromError('');
        return true;
    };

    const validateTo = () => {
        if (!to) {
            setToError('Please enter a valid destination.');
            return false;
        }
        setToError('');
        return true;
    };

    const validateFare = () => {
        if (!fare) {
            setFareError('Please enter a fare amount.');
            return false;
        }
        if (isNaN(fare) || parseFloat(fare) <= 0) {
            setFareError('Please enter a valid fare amount.');
            return false;
        }
        setFareError('');
        return true;
    };

    const validateSeats = () => {
        let maxSeats;
        let currentUserCarType = hasVehicle ? userVehicleType : selectedVehicle;

        switch (currentUserCarType) {
            case 'bike':
                maxSeats = 1;
                break;
            case 'ride':
            case 'ride-mini':
                maxSeats = 4;
                break;
            case 'suv':
                maxSeats = 8;
                break;
            default:
                maxSeats = 1;
        }
        if (seats > maxSeats) {
            setSeatsError(`Maximum seats allowed for ${selectedVehicle} is ${maxSeats}.`);
            return false;
        }

        setSeatsError('');
        return true;
    }
    const validateVehicleSelection = () => {
        if (!selectedVehicle && !hasVehicle) {
            setVehicleError("Please select a vehicle.");
            return false;
        }
        setVehicleError("");
        return true;
    };
    const validateInputs = () => {
        const isValidFrom = validateFrom();
        const isValidTo = validateTo();
        const isValidFare = validateFare();
        const isValidSeats = validateSeats();
        const isValidVehicle = validateVehicleSelection();
        console.log(isValidFrom && isValidTo && isValidFare && isValidSeats && isValidVehicle)
        return isValidFrom && isValidTo && isValidFare && isValidSeats && isValidVehicle;
    };

    useEffect(() => {
        const fetchDriverInfo = async () => {
            try {
                const docRef = doc(firestoreDB, 'driverInfo', currentUser._id);
                const docSnapshot = await getDoc(docRef);

                if (docSnapshot.exists()) {
                    console.log(docSnapshot)
                    const vehicleType = docSnapshot.data().type;
                    const vehicle = vehicles.find(vehicle => vehicle.name === vehicleType);
                    const vehicleId = vehicle ? vehicle.id : null;
                    setUserVehicleType(vehicleId)
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching driver info:', error);
            }
        };

        fetchDriverInfo();

    }, [])

    const handleUserTypeChange = (newValue) => {
        setHasVehicle(newValue);
        setSelectedVehicle(null)
    };

    const saveRequest = async () => {
        const requestData = {
            createdBy: currentUser._id,
            from: from,
            to: to,
            seats: seats,
            fare: parseInt(fare, 10),
            music: music,
            gender: gender,
            ac: ac,
            timestamp: Timestamp.now()
        };
        if (!hasVehicle) {
            requestData.vehicleType = selectedVehicle;
        }
        try {
            var collectionName = hasVehicle ? 'findRiderRequests' : 'findHostRequests';
            if (schedule) {
                collectionName = hasVehicle ? 'findScheduledRiderRequests' : 'findScheduledHostRequests';
                requestData.schedule = schedule;
                requestData.startDate = startDate;
                requestData.endDate = endDate;
            }
            const docRef = await addDoc(collection(firestoreDB, collectionName), requestData);
            console.log('Request added with ID: ', docRef.id);
            requestData.id = docRef.id
            console.log(requestData)
            return requestData;
        } catch (error) {
            console.error('Error adding request: ', error);

        }
    };
    const handleScheduleSet = (receivedSchedule, receivedStartDate, receivedEndDate, roundTrip) => {
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const filteredSchedule = receivedSchedule.reduce((acc, daySchedule, index) => {
            const dayOfWeek = daysOfWeek[index];
            if (daySchedule.enabled) {
                acc[dayOfWeek] = {
                    Earliest: daySchedule.Earliest,
                    Other: daySchedule.Other,
                    Return: roundTrip ? daySchedule.Return : null,
                    'Return Dropoff': roundTrip ? daySchedule['Return Dropoff'] : null,
                    enabled: true
                };
            }
            return acc;
        }, {});
        setRoundTrip(roundTrip);
        setRawSchedule(receivedSchedule);
        setSchedule(filteredSchedule);
        setStartDate(receivedStartDate);
        setEndDate(receivedEndDate);
        setShowSchedule(false);
        setIsDropDownVisible(false)
        setSelectedSchedule('Prescheduled')
        console.log(filteredSchedule)
    };
    const onClose = () => {
        setShowSchedule(false);
        setIsDropDownVisible(false)
    }
    return (
        <>
            {showSchedule &&
                (
                    <View style={{ height: windowHeight, marginTop: 25 }}>
                        <SetSchedule
                            roundTripProp={roundTrip}
                            scheduleProp={rawSchedule}
                            startDateProp={startDate}
                            endDateProp={endDate}
                            onScheduleSet={handleScheduleSet}
                            onClose={onClose}
                        /></View>)}

            <View style={styles.container}>
               {location && <MapView
                    style={styles.map}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    initialRegion={{
                        latitude: location?.latitude,
                        longitude: location?.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.03,
                    }}
                >
                   
                </MapView>}
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 10, position: 'absolute', top: 30, left: 10 }}>
                    <Icon type='font-awesome-5' name='bars' color={GlobalColors.primary} />
                </TouchableOpacity>
                {isMenuVisible && <Menu setMenuVisible={setMenuVisible} />}
                <View style={styles.formContainer}>
                    <ScrollView>
                        <View style={styles.checkBoxContainer}>
                            <Checkbox
                                value={hasVehicle}
                                onValueChange={handleUserTypeChange}
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
                        {vehicleError ? <Text style={{ color: 'red', fontSize: 12 }}>{vehicleError}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Icon name='map-marker' type='font-awesome' color={GlobalColors.primary} />
                            <Input
                                placeholder=" From"
                                inputContainerStyle={{ borderBottomWidth: 0 }}
                                onChangeText={setFrom}
                                containerStyle={{ flex: 1, paddingTop: 5, height: 50 }}
                                inputStyle={styles.input}
                            />
                        </View>
                        {fromError ? <Text style={{ color: 'red', fontSize: 12 }}>{fromError}</Text> : null}

                        <View style={styles.inputContainer}>
                            <Icon name='search-location' type='font-awesome-5' color={GlobalColors.primary} />
                            <Input
                                placeholder="Where to?"
                                inputContainerStyle={{ borderBottomWidth: 0 }}
                                containerStyle={{ flex: 1, paddingTop: 5, height: 50 }}
                                inputStyle={styles.input}
                                onChangeText={setTo}

                            />
                            <TouchableOpacity onPress={() => setIsDropDownVisible(true)} style={{ flexDirection: 'row', borderWidth: 1, borderColor: GlobalColors.primary, borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 5 }}>
                                <Icon name='clock-o' type='font-awesome' color={GlobalColors.primary} />
                                <Text style={{ marginHorizontal: 5 }}>{selectedSchedule}</Text>
                                <Icon name='angle-down' type='font-awesome' color={GlobalColors.primary} />
                            </TouchableOpacity>
                            <Modal
                                visible={isDropDownVisible}
                                transparent={true}
                                animationType='slide'
                            >
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                                    <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, minWidth: 200 }}>
                                        <TouchableOpacity style={{ margin: 15 }} onPress={() => { setIsDropDownVisible(false); setSelectedSchedule('Now'); setSchedule(null) }}>
                                            <Icon name='clock' type='font-awesome-5' color={GlobalColors.primary} />
                                            <Text style={{ marginVertical: 5, fontSize: 18, textAlign: 'center' }}>Now</Text>
                                        </TouchableOpacity>
                                        <View style={{ backgroundColor: GlobalColors.primary, maxHeight: 2, flex: 1 }} />
                                        <TouchableOpacity style={{ margin: 15 }} onPress={() => { setIsDropDownVisible(false); setShowSchedule(true) }}>
                                            <Icon name='history' type='font-awesome' color={GlobalColors.primary} />
                                            <Text style={{ marginVertical: 5, fontSize: 18, textAlign: 'center' }}>Prescheduled</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
                        </View>

                        {toError ? <Text style={{ color: 'red', fontSize: 12 }}>{toError}</Text> : null}

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
                        {seatsError ? <Text style={{ color: 'red', fontSize: 12 }}>{seatsError}</Text> : null}
                        <View style={styles.inputContainer}>
                            <Icon name="money-bill-wave" type="font-awesome-5" color={GlobalColors.primary} />
                            <Input
                                placeholder="Offer your Fare"
                                inputContainerStyle={{ borderBottomWidth: 0 }}
                                containerStyle={{ flex: 1, height: 50, paddingTop: 5 }}
                                inputStyle={styles.input}
                                keyboardType="numeric"
                                onChangeText={setFare}
                            />
                        </View>
                        {fareError ? <Text style={{ color: 'red', fontSize: 12 }}>{fareError}</Text> : null}
                        <Text style={[styles.label, styles.preferableRequirements]}>Preferable Requirements</Text>
                        <View style={[styles.container, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                            <View style={styles.checkBoxContainer}>
                                <Checkbox value={ac} onValueChange={setAC} color={GlobalColors.primary} />
                                <Text style={[styles.label, { paddingHorizontal: 10 }]}>AC</Text>
                            </View>
                            <View style={styles.checkBoxContainer}>
                                <Checkbox value={gender} onValueChange={setGender} color={GlobalColors.primary} />
                                <Text style={[styles.label, { paddingHorizontal: 10 }]}>Same Gender</Text>
                            </View>
                            <View style={styles.checkBoxContainer}>
                                <Checkbox value={music} onValueChange={setMusic} color={GlobalColors.primary} />
                                <Text style={[styles.label, { paddingHorizontal: 10 }]}>Music</Text>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: hasVehicle ? GlobalColors.secondary : GlobalColors.primary }]}
                                onPress={async () => {
                                    if (validateInputs()) {
                                        const MyRequest = await saveRequest();
                                        if (!schedule) {
                                            navigation.navigate('FindHost', MyRequest);
                                        } else {
                                            const serializedRequest = { ...MyRequest, startDate: MyRequest.startDate.toISOString(), endDate: MyRequest.endDate.toISOString() };
                                            navigation.navigate('FindScheduledHost', serializedRequest)
                                        }

                                    }
                                }}
                                disabled={hasVehicle}
                            >
                                <Text style={styles.buttonText}>Find a Host</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: hasVehicle ? GlobalColors.primary : GlobalColors.secondary }]}
                                onPress={async () => {
                                    if (validateInputs()) {
                                        const MyRequest = await saveRequest();
                                        if (!schedule) {
                                            navigation.navigate('FindRider', MyRequest);
                                        } else {
                                            const serializedRequest = { ...MyRequest, startDate: MyRequest.startDate.toISOString(), endDate: MyRequest.endDate.toISOString() };
                                            navigation.navigate('FindScheduledRider', { request: serializedRequest })
                                        }
                                    }
                                }}
                                disabled={!hasVehicle}
                            >
                                <Text style={styles.buttonText}>Find a Rider</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>

        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: windowWidth,
        height: windowHeight * 0.35,
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
        paddingVertical: 5,
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
        marginTop: 10
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