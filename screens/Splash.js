import { View, Text, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import React from 'react';
import GlobalColors from '../styles/globalColors';
import { useLayoutEffect } from 'react';
import { firebaseAuth, firestoreDB } from '../config/firebase.config';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { getDoc, doc } from 'firebase/firestore';
import { SET_USER } from '../context/actions/userActions';
import { useState } from 'react';
import { Image } from 'react-native-elements';
const SplashScreen = () => {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        checkLoggedUser();
    }, [])
    const dispatch = useDispatch()
    const checkLoggedUser = async () => {
        firebaseAuth.onAuthStateChanged((userCred) => {
            if (0==1) {
                try {
                    getDoc(doc(firestoreDB, "users", userCred?.uid)).then((docSnap) => {
                        if (docSnap.exists()) {
                            console.log(docSnap.data());
                            dispatch(SET_USER(docSnap.data()))
                            console.log(docSnap.data().status)
                            setTimeout(() => {
                                if (docSnap.data().status == 'unverified') {
                                    navigation.replace('OTP')
                                } else if (docSnap.data().status == 'verified') {
                                    navigation.replace("DuringRideHost")
                                }
                            }, 1000)
                        }
                    })

                } catch (e) {
                    console.error("Error getting document: ", e);
                }
            } else {
                setTimeout(() => {
                    navigation.replace('DuringRideHost')
                }, 1000)
            }
        })
    }
    return (
        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Image
                source={require('../assets/logo.png')}
                style={{ width: 300, height: 130, resizeMode: 'contain' }}
            />
            <Text style={{fontSize:19, color: GlobalColors.secondary,fontWeight:'bold',fontStyle:'italic',marginBottom:50}}>Making Miles Meaningful.</Text>
            <ActivityIndicator size={"large"} color={GlobalColors.secondary} />
        </View>
    )
}

export default SplashScreen;