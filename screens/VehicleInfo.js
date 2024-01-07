import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Picker from '../components/Picker';
import { Alert } from 'react-native';
import { ScrollView } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { Icon, Image } from 'react-native-elements';
import { useSelector } from 'react-redux';
import { firestoreDB } from '../config/firebase.config';
import { doc, setDoc } from 'firebase/firestore';

const VehicleInfo = () => {
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleNumberPlate, setVehicleNumberPlate] = useState('');
    const [driverLicense, setDriverLicense] = useState('');
    const [vehicleRegistration, setVehicleRegistration] = useState('');
    const [licenseImage, setLicenseImage] = useState(null);
    const [registrationImage, setRegistrationImage] = useState(null);

    const [vehicleTypeError, setVehicleTypeError] = useState('');
    const [vehicleMakeError, setVehicleMakeError] = useState('');
    const [vehicleModelError, setVehicleModelError] = useState('');
    const [vehicleYearError, setVehicleYearError] = useState('');
    const [vehicleNumberPlateError, setVehicleNumberPlateError] = useState('');
    const [driverLicenseError, setDriverLicenseError] = useState('');
    const [vehicleRegistrationError, setVehicleRegistrationError] = useState('');
    const [imagesError, setImagesError] = useState('');

    const user = useSelector((state) => state.user.user);

    const navigation = useNavigation();
    const handleImagePicker = (type) => {
        Alert.alert(
            'Choose Avatar Source',
            'Select how to set your profile picture',
            [
                {
                    text: 'Open Camera',
                    onPress: () => handleCameraLaunch(type),
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => openImagePicker(type),
                }
            ],
            { cancelable: true }
        );
    };
    const openImagePicker = async (type) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [5, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                if (type === 'License') {
                    setLicenseImage(imageUri)
                } else {
                    setRegistrationImage(imageUri)
                }
            }
        } catch (error) {
            console.error('Error selecting image:', error);
        }
    };

    const handleCameraLaunch = async (type) => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [5, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                if (type === 'License') {
                    setLicenseImage(imageUri)
                } else {
                    setRegistrationImage(imageUri)
                }
            }
        } catch (error) {
            console.error('Error capturing image:', error);
        }
    };


    const validateVehicleType = (type) => {
        setVehicleType(type);
        setVehicleTypeError(type.trim() === '' ? 'Please select a valid vehicle type' : '');
    };

    const validateVehicleMake = (make) => {
        setVehicleMake(make);
        setVehicleMakeError(make.trim() === '' ? 'Please enter a valid vehicle make' : '');
    };

    const validateVehicleModel = (model) => {
        setVehicleModel(model);
        setVehicleModelError(model.trim() === '' ? 'Please enter a valid vehicle model' : '');
    };

    const validateVehicleYear = (year) => {
        setVehicleYear(year);
        setVehicleYearError(year.trim() === '' || !/^\d{4}$/.test(year.trim()) ? 'Please enter a valid 4-digit vehicle year' : '');
    };

    const validateVehicleNumberPlate = (numberPlate) => {
        setVehicleNumberPlate(numberPlate);
        setVehicleNumberPlateError(numberPlate.trim() === '' ? 'Please enter a valid vehicle number plate' : '');
    };

    const validateDriverLicense = (license) => {
        setDriverLicense(license);
        setDriverLicenseError(license.trim() === '' ? 'Please enter a valid driver license' : '');
    };

    const validateVehicleRegistration = (registration) => {
        setVehicleRegistration(registration);
        setVehicleRegistrationError(registration.trim() === '' ? 'Please enter a valid vehicle registration' : '');
    };

    const validateImages = () => {
        setImagesError(!licenseImage || !registrationImage ? 'Please upload license and registration images' : '');
    };

    const validateAllFields = () => {
        validateVehicleType(vehicleType);
        validateVehicleMake(vehicleMake);
        validateVehicleModel(vehicleModel);
        validateVehicleYear(vehicleYear);
        validateVehicleNumberPlate(vehicleNumberPlate);
        validateDriverLicense(driverLicense);
        validateVehicleRegistration(vehicleRegistration);
        validateImages();
    };

    const handleNext = () => {
        // Validate input fields and uploaded images before proceeding to the next screen
        validateAllFields();

        // Check if there are any errors
        if (
            vehicleTypeError ||
            vehicleMakeError ||
            vehicleModelError ||
            vehicleYearError ||
            vehicleNumberPlateError ||
            driverLicenseError ||
            vehicleRegistrationError ||
            imagesError
        ) {
            Alert.alert('Error', 'Invalid Inputs Entered')
            return;
        }
        saveVehicleAndLicenseInfo();

        navigation.navigate('RequestCreation');
    };
    const saveVehicleAndLicenseInfo = async () => {
        try {
            const userId = user._id;
            // Add the vehicle and license information to the document
            data = {
                type: vehicleType,
                make: vehicleMake,
                model: vehicleModel,
                year: vehicleYear,
                numberPlate: vehicleNumberPlate,
                driverLicense: driverLicense,
                registration: vehicleRegistration,
                licenseImage: licenseImage,
                registrationImage: registrationImage,
            }
            await setDoc(doc(firestoreDB, "driverInfo", userId), data);
            console.log('Vehicle and license information saved successfully!');
        } catch (error) {
            console.error('Error saving vehicle and license information:', error);
        }
    };
    return (
        <ScrollView>
            <View style={styles.container}>
                <Text style={styles.heading}>Vehicle Information</Text>
                <Picker
                    options={[
                        { label: 'Select Vehicle Type', value: '', icon: 'question-circle' },
                        { label: 'Bike', value: 'Bike', icon: 'bicycle' },
                        { label: 'Ride', value: 'Ride', icon: 'car' },
                        { label: 'Ride Mini', value: 'Ride Mini', icon: 'car' },
                        { label: 'SUV', value: 'SUV', icon: 'truck' },
                    ]}
                    selectedValue={vehicleType}
                    onValueChange={(itemValue) => validateVehicleType(itemValue)}
                    placeholder="Select Vehicle Type"
                />
                {vehicleTypeError !== '' && <Text style={styles.errorText}>{vehicleTypeError}</Text>}
                <TextInput
                    style={[styles.input, vehicleMakeError && styles.errorInput]}
                    placeholder="Vehicle Make"
                    value={vehicleMake}
                    onChangeText={(text) => validateVehicleMake(text)}
                />
                {vehicleMakeError !== '' && <Text style={styles.errorText}>{vehicleMakeError}</Text>}
                <TextInput
                    style={[styles.input, vehicleModelError && styles.errorInput]}
                    placeholder="Vehicle Model"
                    value={vehicleModel}
                    onChangeText={(text) => validateVehicleModel(text)}
                />
                {vehicleModelError !== '' && <Text style={styles.errorText}>{vehicleModelError}</Text>}
                <TextInput
                    style={[styles.input, vehicleYearError && styles.errorInput]}
                    placeholder="Vehicle Year"
                    value={vehicleYear}
                    onChangeText={(text) => validateVehicleYear(text)}
                    keyboardType="numeric" // Restrict input to numeric values
                    maxLength={4} // Set a maximum length for the year input
                />
                {vehicleYearError !== '' && <Text style={styles.errorText}>{vehicleYearError}</Text>}
                <TextInput
                    style={[styles.input, vehicleNumberPlateError && styles.errorInput]}
                    placeholder="Vehicle Number Plate"
                    value={vehicleNumberPlate}
                    onChangeText={(text) => validateVehicleNumberPlate(text)}
                />
                {vehicleNumberPlateError !== '' && <Text style={styles.errorText}>{vehicleNumberPlateError}</Text>}
                <TextInput
                    style={[styles.input, driverLicenseError && styles.errorInput]}
                    placeholder="Driver's License"
                    value={driverLicense}
                    onChangeText={(text) => validateDriverLicense(text)}
                />
                {driverLicenseError !== '' && <Text style={styles.errorText}>{driverLicenseError}</Text>}
                <TextInput
                    style={[styles.input, vehicleRegistrationError && styles.errorInput]}
                    placeholder="Vehicle Registration"
                    value={vehicleRegistration}
                    onChangeText={(text) => validateVehicleRegistration(text)}
                />
                {vehicleRegistrationError !== '' && <Text style={styles.errorText}>{vehicleRegistrationError}</Text>}

                <View style={styles.imageUploadContainer}>
                    <TouchableOpacity style={styles.imageUpload} onPress={() => handleImagePicker('License')}>
                        {!licenseImage && <View style={{ padding: 20 }}>
                            <Icon name="upload" type="font-awesome-5" color={GlobalColors.primary} size={24} />
                            <Text style={styles.uploadText}>Upload License Image</Text>
                        </View>}
                        {licenseImage && <Image source={{ uri: licenseImage }} style={styles.uploadedImage} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.imageUploadContainer}>
                    <TouchableOpacity style={styles.imageUpload} onPress={() => handleImagePicker('Registration')}>
                        {!registrationImage && <View style={{ padding: 20 }}>
                            <Icon name="upload" type="font-awesome-5" color={GlobalColors.primary} size={24} />
                            <Text style={styles.uploadText}>Upload Registration Image</Text>
                        </View>}
                        {registrationImage && <Image source={{ uri: registrationImage }} style={styles.uploadedImage} />}
                    </TouchableOpacity>
                </View>
                {imagesError !== '' && <Text style={styles.errorText}>{imagesError}</Text>}
                <TouchableOpacity style={styles.button} onPress={handleNext} >
                    <Text style={styles.buttonText}>Submit</Text>
                    <Icon name="long-arrow-alt-right" type="font-awesome-5" color={GlobalColors.background} size={24} style={{ marginHorizontal: 10 }} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-around',
        paddingTop: 40,
        padding: 20
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    }, input: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 20,
        marginVertical: 7,
        width: '100%',
        height: '5%',
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 30,
        color: GlobalColors.primary,
        marginVertical: 10,
        flex: 1,
    },
    button: {
        backgroundColor: GlobalColors.primary,
        padding: 15,
        paddingLeft: 25,
        marginVertical: '4%',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto'
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    imageUploadContainer: {
        borderStyle: 'dashed',
        borderWidth: 1,
        borderRadius: 10,
        marginVertical: 5,
        padding: 5,
        justifyContent: 'center'
    },
    imageUpload: {
        alignItems: 'center',
    },
    uploadText: {
        color: GlobalColors.primary,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    uploadedImage: {
        resizeMode: 'cover',
        borderRadius: 10,
        height: 100,
        width: 250,
    }
});

export default VehicleInfo;