import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native';
import SuccessModal from '../components/successModal';
import ErrorModal from '../components/errorModal'
import { Icon } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Keyboard } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { firestoreDB } from '../config/firebase.config';
import { doc, setDoc } from 'firebase/firestore';
import { SET_USER } from '../context/actions/userActions';
import { BASE_URL } from '../config/backend';

const OTPScreen = () => {
  const navigation = useNavigation();
  const [otp, setOTP] = useState('');
  const [countdown, setCountdown] = useState(120); // 5 minutes in seconds
  const [resendDisabled, setResendDisabled] = useState(true);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isFailureModalVisible, setIsFailureModalVisible] = useState(false);
  const [userOtp, setUserOTP] = useState(['', '', '', '']);
  const inputs = [];
  const user = useSelector((state) => state.user.user);
  const email = user?.email;
  const hasVehicle = user?.driver;
  const dispatch=useDispatch();
  const handleOtpChange = (value, index) => {
    const newOtp = [...userOtp];
    newOtp[index] = value;
    setUserOTP(newOtp);
    // Move focus to the next box if the current one has a value
    if (value && index < newOtp.length - 1) {
      inputs[index + 1].focus();
    } else if (!value && index > 0) {
      inputs[index - 1].focus();
    }
  };
  useEffect(() => {
    // Call handleSendOTP when the component is mounted
    handleSendOTP();
  }, []);
  useEffect(() => {
    let timer;

    // Start the countdown when the component mounts
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }

    // Clear the interval when the component unmounts
    return () => {
      clearInterval(timer);
    };
  }, [countdown]);
  const generateOTP = () => {
    // Generate a random 4-digit OTP
    const Otp = (Math.floor(1000 + Math.random() * 9000)).toString();
    setOTP(Otp);
    return Otp;
  };
  const verifyOTP = async () => {
    const isOTPValid = userOtp.join('') === otp;

    if (isOTPValid && countdown > 0) {
      // Show success modal
      setIsSuccessModalVisible(true);
      try {
        user.status = 'verified'
        await setDoc(doc(firestoreDB, "users", user._id), user);
        dispatch(SET_USER(user))
      } catch (e) {
        console.error("Error updating document: ", e);
      }
    } else {
      // Show failure modal
      setIsFailureModalVisible(true);
    }
  };
  const handleSendOTP = async () => {
    try {
      const Otp = generateOTP();
      if (user.email) {
        console.log(user.email)
        const serverURL = BASE_URL+'email/send-email';

        // Make a request to your server to trigger OTP email sending
        const response = await axios.get(
          `${serverURL}?to=${email}&subject=Email%20Verification&text=Your%20verification%20code%20is:%20${Otp}`
        );

        // Check if the email was sent successfully
        if (response.data === 'Email sent successfully') {
          console.log('Success, OTP Email sent successfully');
          // Reset countdown and disable resend button
          setCountdown(120);
          setResendDisabled(true);
        } else {
          Alert.alert('Error', 'Error sending OTP Email');
        }
      }
    } catch (error) {
      console.error('Error sending OTP Email:', error);
      Alert.alert('Error', 'Error sending OTP Email');
    }

  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };


  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.mainContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInnerContainer}>
                <Icon name='user-lock' type='font-awesome-5' size={130} color={GlobalColors.primary} />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>Email Verification</Text>
              <Text style={styles.subtitle}>Please enter the 4-digit code sent at <Text style={styles.emailText}>{email}</Text></Text>

              <View style={styles.inputContainer}>
                {userOtp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.inputBox}
                    maxLength={1}
                    keyboardType="numeric"
                    onChangeText={(value) => handleOtpChange(value, index)}
                    value={digit}
                    ref={(input) => {
                      inputs[index] = input;
                    }}
                  />
                ))}
              </View>

              {resendDisabled && <Text style={styles.resendText}>Resend in {formatTime(countdown)}</Text>}
              {!resendDisabled && <TouchableOpacity style={styles.resendButton} onPress={handleSendOTP} disabled={resendDisabled}>
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>}

              <TouchableOpacity style={[styles.button, { marginLeft: 'auto' }]} onPress={verifyOTP}>
                <Icon name="check-circle" type="font-awesome-5" color={GlobalColors.background} size={24} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
          {isSuccessModalVisible && <SuccessModal close={()=>{hasVehicle ? navigation.replace('VehicleInfo') : navigation.replace('RequestCreation')}} />}
          {isFailureModalVisible && <ErrorModal close={()=>{navigation.replace('OTP')}} />}
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    paddingTop: 50,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoInnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 250,
    width: 250,
    borderRadius: 250,
    backgroundColor: GlobalColors.secondary,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-around',
    padding: 20,
  },
  title: {
    fontSize: 25,
    color: GlobalColors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  emailText: {
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  inputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    flexDirection: 'row',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: GlobalColors.primary,
    width: 50,
    height: 50,
    margin: 10,
    textAlign: 'center',
    fontSize: 20,
    padding: 10,
    borderRadius: 10,
  },
  resendText: {
    color: 'gray',
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 15,
  },
  resendButton: {
    alignSelf: 'center',
    marginVertical: 15,
  },
  resendButtonText: {
    fontSize: 18,
    color: GlobalColors.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: GlobalColors.primary,
    padding: 15,
    paddingLeft: 25,
    marginVertical: '3%',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingRight: 30,
  },
});


export default OTPScreen;
