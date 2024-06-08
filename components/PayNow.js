import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import GlobalColors from '../styles/globalColors';
import Feedback from './Feedback';
import { BASE_URL } from '../config/backend';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import { Overlay } from 'react-native-elements';
import { useSelector } from 'react-redux';

const PayNowOverlay = ({ totalAmount, host, riders, rideID }) => {
    const [isOverlayVisible, setOverlayVisible] = useState(true);
    const [isVisible, setVisible] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const currentUser = { _id: 'vzKZXzwFtcfEIG7ctsqmLXsfIJT2' }//useSelector((state) => state.user.user);
   {/* useEffect(() => {
        const timer = setTimeout(() => {
            setOverlayVisible(true);
        }, 10000);
        return () => clearTimeout(timer);

    }, []);*/}

    const onPayNow = async () => {
        try {
            const response = await axios.post(BASE_URL + 'payments/intent',
                {
                    amount: totalAmount*100
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (response.error) {
                Alert.alert('Something went wrong', response.error);
                return;
            }
            if (response.data.error) {
                console.log('My error: ', response.data.error);
            }

            const { error: paymentSheetError } = await initPaymentSheet({
                merchantDisplayName: 'WeGo - Making Miles Meaningful',
                paymentIntentClientSecret: response.data.paymentIntent,
            });
            if (paymentSheetError) {
                Alert.alert('Something went wrong', paymentSheetError.message);
                return;
            }

            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                Alert.alert(`Error code: ${paymentError.code}`, paymentError.message);
                return;
            }
            try {
                const rideRef = doc(collection(firestoreDB, 'ride'), rideID);
                const rideSnapshot = await getDoc(rideRef);
                if (rideSnapshot.exists()) {
                    const rideData = rideSnapshot.data();
                    const riders = rideData.Riders;

                    for (let i = 0; i < riders.length; i++) {
                        if (riders[i].rider === currentUser._id) {
                            riders[i].paid = true;
                            break;
                        }
                    }
                    await updateDoc(rideRef, {
                        Riders: riders
                    });
                    await updateDoc(doc(firestoreDB, 'users', currentUser._id), {
                        fareDue: false
                    });
                    setOverlayVisible(false)
                    console.log('paid')
                    setVisible(true)
                    
                    console.log('Rider fare updated successfully to "paid"');
                } else {
                    console.log("Ride does not exist.");
                }
            } catch (error) {
                console.error('Error updating ride status:', error);
            }
        } catch (error) {
            console.error('Payment error:', error.message);
            Alert.alert('Payment failed', error.message);
        }
    };
    return (
        <>
            <Overlay  isVisible={isOverlayVisible}  overlayStyle={[styles.overlay, { height: 200 }]}>
                <View style={styles.overlayContainer}>
                    <Text style={styles.title}>Ride Payment</Text>
                    <Text style={{ textAlign: 'center' }}>Your ride is about to end.</Text>

                    <Text style={styles.fare}>Fare: {totalAmount}</Text>

                    <TouchableOpacity style={styles.payNowButton} onPress={onPayNow}>
                        <Text style={styles.buttonText}>Pay Now</Text>
                    </TouchableOpacity>

                </View>
            </Overlay>
            {isVisible && <Feedback host={host} riders={riders} rideID={rideID}/>}
        </>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: GlobalColors.primary
    },
    paymentDetails: {
        marginBottom: 16,
        alignItems: 'center'
    },
    fare: {
        fontSize: 25,
        color: GlobalColors.primary,
        textAlign: 'center'
    },
    payNowButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default PayNowOverlay;