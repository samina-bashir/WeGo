import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Icon, Input, ButtonGroup } from 'react-native-elements';
import Checkbox from 'expo-checkbox';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, firestoreDB } from '../config/firebase.config';
import { doc, addDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { SET_USER } from '../context/actions/userActions';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedGenderIndex, setSelectedGenderIndex] = useState(2);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [avatarSource, setAvatarSource] = useState(null);
  const genderIcons = [
    { icon: 'mars', label: 'Male' },
    { icon: 'venus', label: 'Female' },
    { icon: 'genderless', label: 'Other' },
  ];
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleSignUp = async () => {
    isError=validateAllFields();
    if (isError) {
      Alert.alert('Error','Invalid Inputs Entered');
      console.log('error');
    } else {
      try {
        const userCredentials = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (userCredentials && userCredentials.user && userCredentials.user.uid) {

          const data = {
            _id: userCredentials.user.uid,
            profilePic: avatarSource,
            name,
            email,
            phoneNumber,
            gender: selectedGenderIndex,
            driver: hasVehicle,
            status: 'unverified',
            rating: 0,
            cancellationHost: 0,
            cancellationRider: 0
          };
          
          try {
            await setDoc(doc(firestoreDB, "users",userCredentials.user.uid), data);
            dispatch(SET_USER(data))

          } catch (e) {
            console.error("Error adding document: ", e);
          }

          navigation.navigate("OTP");
        }
      } catch (error) {
        // Handle the error by displaying an alert with specific messages based on error codes
        let errorMessage = 'An error occurred. Please try again.';

        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Email is already in use. Please use a different email address.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please enter a valid email.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Weak password. Please choose a stronger password.';
            break;

          default:
            break;
        }
        console.log(error)
        Alert.alert('Error', errorMessage);
      }
    }
  };
  const validateName = (text) => {
    setName(text);
    setNameError(text.trim() === '' ? 'Please enter your name' : '');
  };

  const validateEmail = (text) => {
    setEmail(text);

    if (text.trim() === '') {
      setEmailError('Please enter an email address');
    } else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))) {
      setEmailError('Please enter a valid email address');
    } else if (text.toLowerCase().endsWith('@gmail.com')) {
      setEmailError('Please use your institute email');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (text) => {
    setPassword(text);
    // Password must be at least 8 characters long
    // and contain at least one uppercase letter, one lowercase letter, and one digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    setPasswordError(
      text.trim() === ''
        ? 'Please enter a password'
        : !passwordRegex.test(text)
          ? 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.'
          : ''
    );
  };

  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    setConfirmPasswordError(text !== password ? 'Passwords do not match' : '');
  };

  const validatePhoneNumber = (text) => {
    setPhoneNumber(text);
    setPhoneNumberError(text.trim() !== '' && !(/^\d{10}$/.test(text)) ? 'Please enter a valid phone number' : '');
  };
  const validateAllFields = () => {
    validateName(name);
    validateEmail(email);
    validatePassword(password);
    validateConfirmPassword(confirmPassword);
    validatePhoneNumber(phoneNumber);

    const errors = [
      nameError,
      emailError,
      passwordError,
      confirmPasswordError,
      phoneNumberError,
    ];
    const hasError = errors.some((error) => error.length > 1);
    return hasError;
  };
  const renderInputWithIcon = (placeholder, iconName, value, onChangeText, errorMessage, keyboardType = 'default', password = false) => (
    <><View style={styles.inputContainer}>
      <Icon name={iconName} type="font-awesome" color={GlobalColors.primary} />
      <Input
        placeholder={placeholder}
        containerStyle={{ flex: 1, height: 50, paddingTop: 5 }}
        inputStyle={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={password && !isPasswordVisible}
        inputContainerStyle={{ borderBottomWidth: 0 }}
      />
      {password && (
        <Icon
          name={isPasswordVisible ? 'eye-slash' : 'eye'}
          type="font-awesome"
          color={GlobalColors.primary}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        />
      )}
    </View>
      <View>
        {errorMessage !== '' && (
          <Text style={{ color: 'red', fontSize: 12 }}>{errorMessage}</Text>
        )}</View>
    </>
  );
  const handleAvatarUpload = () => {
    Alert.alert(
      'Choose Avatar Source',
      'Select how to set your profile picture',
      [
        {
          text: 'Open Camera',
          onPress: () => handleCameraLaunch(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => openImagePicker(),
        }
      ],
      { cancelable: true }
    );
  };
  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setAvatarSource(imageUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleCameraLaunch = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setAvatarSource(imageUri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.subContainer}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Text style={styles.heading}>SignUp</Text>
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={handleAvatarUpload}>
            <View style={styles.avatarContainer}>
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} style={styles.avatarImage} resizeMode="contain" />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Image source={require('../assets/avatar.jpg')} style={styles.avatarImage} />
                  <Text style={styles.avatarText}>+</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {renderInputWithIcon('Enter your name', 'user', name, validateName, nameError)}
        {renderInputWithIcon('Enter your email', 'envelope', email, validateEmail, emailError, 'email-address')}
        {renderInputWithIcon('Set your password', 'lock', password, validatePassword, passwordError, undefined, true)}
        {renderInputWithIcon('Confirm password', 'lock', confirmPassword, validateConfirmPassword, confirmPasswordError, undefined, true)}
        {renderInputWithIcon('Enter your phone number', 'phone', phoneNumber, validatePhoneNumber, phoneNumberError, 'phone-pad')}
        <View style={{ ...styles.inputContainer, width: '100%' }}>
          <Icon name="car" type="font-awesome" color={GlobalColors.primary} />
          <Text style={{ fontSize: 16, padding: 15 }}>Do you have a vehicle?</Text>

          <Checkbox
            style={{ marginLeft: 'auto' }}
            value={hasVehicle}
            onValueChange={setHasVehicle}
            color={GlobalColors.primary}
          />
        </View>

        <ButtonGroup
          onPress={(index) => setSelectedGenderIndex(index)}
          selectedIndex={selectedGenderIndex}
          buttons={genderIcons.map((item) => (
            <View key={item.icon} >
              <Icon name={item.icon} type="font-awesome" color={GlobalColors.background} />
              <Text style={{ color: GlobalColors.background }}>{item.label}</Text>
            </View>
          ))}
          containerStyle={styles.buttonGroupContainer}
          buttonStyle={styles.buttonGroupButton}
          selectedButtonStyle={styles.selectedButton}
        />

        <TouchableOpacity title="Sign Up" style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
          <Icon name="long-arrow-alt-right" type="font-awesome-5" color={GlobalColors.background} size={24} style={{ marginHorizontal: 10 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Signin')}
        >
          <Text style={styles.loginText}>
            Already have an Account?{' '}
            <Text style={styles.loginLink}>Login</Text>
          </Text></TouchableOpacity>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: '20%',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  subContainer: {
    flex: 1,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarContainer: {
    flex: 1,
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 25,
    color: GlobalColors.primary,
    position: 'absolute',
    top: -10,
    right: 10
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlobalColors.primary,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 0,
    marginVertical: 1
  },
  buttonGroupContainer: {
    marginVertical: '3%',
    height: 70,
    borderWidth: 0
  },
  buttonGroupButton: {
    backgroundColor: GlobalColors.secondary,
    borderRadius: 30,
    padding: 5,
  },
  selectedButton: {
    backgroundColor: GlobalColors.primary,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 30,
    color: GlobalColors.primary,
    marginVertical: 5,
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
  }, loginText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10, // Adjust the spacing as needed
    fontSize: 16,
  },
  loginLink: {
    fontWeight: 'bold',
    color: GlobalColors.primary,
  },
});

export default SignUp;
