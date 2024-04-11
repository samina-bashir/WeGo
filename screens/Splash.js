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
            if (userCred?.uid) {
                try {
                    getDoc(doc(firestoreDB, "users", userCred?.uid)).then((docSnap) => {
                        if (docSnap.exists()) {
                            console.log(docSnap.data());
                            dispatch(SET_USER(docSnap.data()))
                            const email = docSnap.data().email;
                            const domain = email.substring(email.lastIndexOf("@") + 1);
                            const orgRef = doc(firestoreDB, 'organizations', domain);
            
                            // Get the document
                            getDoc(orgRef).then((docSnapshot) => {
                                if (docSnapshot.exists()) {
                                    docSnap.data().orgName = docSnapshot.data().Name;
                                    if ( docSnapshot.data().status=='rejected') {
                                        navigation.replace('Suspended Domain')
                                    }
                                }
                            }).catch((error) => {
                                console.error("Error getting organization:", error);
                            });
                            console.log(docSnap.data().status)
                            setTimeout(() => {
                                console.log('ok')
                                if (docSnap.data().status == 'Unverified') {
                                    navigation.replace('OTP')
                                } else if (docSnap.data().fareDue) {
                                    navigation.replace('PayFare')
                                } else if (docSnap.data().status == 'Verified') {
                                    console.log('ok2')
                                    navigation.replace("RequestCreation")
                                }
                            }, 1000)
                        }
                    })

                } catch (e) {
                    console.error("Error getting document: ", e);
                }
            } else {
                setTimeout(() => {
                    console.log('ok4')
                    navigation.replace('Signin')
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