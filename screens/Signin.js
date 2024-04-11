import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Icon, Input } from 'react-native-elements';
import { StyleSheet } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestoreDB } from '../config/firebase.config';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { SET_USER } from '../context/actions/userActions';
import { Alert } from 'react-native';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch()

  const handleSignIn = async () => {
    try {
      const userCredentials = await signInWithEmailAndPassword(firebaseAuth, email, password);
      
      if (userCredentials && userCredentials.user && userCredentials.user.uid) {
        if (email=='admin@wego.com'){
          navigation.replace('Admin')
        }
        try {
          docSnap = await getDoc(doc(firestoreDB, "users", userCredentials.user.uid));
          if (docSnap.exists()) {
            dispatch(SET_USER(docSnap.data()));
            if(docSnap.data().status==='unverified'){
              navigation.replace('OTP')
            }else{
              console.log('going')
              navigation.replace("RequestCreation");
            }
          }
        } catch (e) {
          console.error("Error getting document: ", e);
        }
        
      }
    } catch (error) {
      // Handle the error by displaying an alert with specific messages based on error codes
      let errorMessage = 'An error occurred. Please try again.';

      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid Credentials';
          break;
        case 'auth/missing-password':
          errorMessage = 'Password is not entered.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid Email Entered';
          break;
        default:
          break;
      }
      console.log(error)
      Alert.alert('Error', errorMessage);
    }
  };

  const renderInputWithIcon = (placeholder, iconName, value, onChangeText, keyboardType = 'default', secureTextEntry = false) => (
    <View style={styles.inputContainer}>
      <Icon name={iconName} type="font-awesome" color={GlobalColors.primary} />
      <Input
        placeholder={placeholder}
        containerStyle={{ flex: 1, height: 50, paddingTop: 5 }}
        inputStyle={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        inputContainerStyle={{ borderBottomWidth: 0 }}
      />
      {secureTextEntry && (
        <Icon
          name={isPasswordVisible ? 'eye-slash' : 'eye'}
          type="font-awesome"
          color={GlobalColors.primary}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SignIn</Text>

      {renderInputWithIcon('Enter your email', 'envelope', email, setEmail, 'email-address')}
      {renderInputWithIcon('Enter your password', 'lock', password, setPassword, undefined, true)}

      <TouchableOpacity title="Sign In" style={[styles.button, { marginLeft: 'auto' }]} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Login</Text>
        <Icon name="long-arrow-alt-right" type="font-awesome-5" color="#fff" size={24} style={{ marginHorizontal: 10 }} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.loginText}>
          Don't have an Account?{' '}
          <Text style={styles.loginLink}>Create Now</Text>
        </Text></TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: '60%',
    justifyContent: 'center',
    flexDirection: 'column',
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
    marginVertical: 0
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 30,
    color: GlobalColors.primary,
    marginVertical: '7%',
  },
  button: {
    backgroundColor: GlobalColors.primary,
    padding: 15,
    paddingLeft: 25,
    marginVertical: '2%',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  }, loginText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10,
    fontSize: 16,
  },
  loginLink: {
    fontWeight: 'bold',
    color: GlobalColors.primary,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1
  },

});

export default SignIn;
