import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Overlay, Alert } from 'react-native-elements';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import { collection, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import GlobalColors from '../styles/globalColors';
import { BASE_URL } from '../config/backend';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const PayFare = () => {
    const [unpaidRide, setUnpaidRide] = useState(null);
    const [isOverlayVisible, setOverlayVisible] = useState(true);
    const [isVisible, setVisible] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const currentUser = useSelector((state) => state.user.user)
    const navigation = useNavigation()
    useEffect(() => {

        const fetchUnpaidRide = async () => {
            try {
                const ridesRef = collection(firestoreDB, 'ride');
                const querySnapshot = await getDocs(ridesRef);

                for (const doc of querySnapshot.docs) {
                    const rideData = doc.data();
                    if (
                        rideData.Riders.some(rider => rider.rider === currentUser._id && !rider.paid && rider.status !== 'cancelled')
                    ) {
                        const unpaidRide = { id: doc.id, ...rideData };
                        console.log("Unpaid ride:", unpaidRide);
                        setUnpaidRide(unpaidRide);
                        setOverlayVisible(true);
                        return; // Return the first unpaid ride that meets the criteria
                    }
                }

                console.log("No unpaid rides found.");
                navigation.navigate('RequestCreation');
            } catch (error) {
                console.error('Error fetching unpaid ride:', error);
            }
        };


        fetchUnpaidRide();

    }, []);

    const onPayNow = async () => {
        if (!unpaidRide) return;

        try {
        console.log(getTotalAmountForCurrentUser(unpaidRide.Riders) * 100)
            const response = await axios.post(BASE_URL + 'payments/intent', {
                amount: getTotalAmountForCurrentUser(unpaidRide.Riders) * 100
            }, { headers: { 'Content-Type': 'application/json' } });

            if (response.error || response.data.error) {
                Alert.alert('Something went wrong', response.error || response.data.error);
                return;
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
                const rideRef = doc(collection(firestoreDB, 'ride'), unpaidRide.id);
                const rideSnapshot = await getDoc(rideRef);

                if (rideSnapshot.exists()) {
                    const rideData = rideSnapshot.data();
                    const updatedRiders = rideData.Riders.map(rider => {
                        if (rider.rider === currentUser._id) {
                            return { ...rider, paid: true };
                        }
                        return rider;
                    });

                    await updateDoc(rideRef, { Riders: updatedRiders });
                    await updateDoc(doc(firestoreDB, 'users', currentUser._id), {
                        fareDue: false
                    });
                    setOverlayVisible(false);
                    setVisible(true);
                    console.log('Rider fare updated successfully to "paid"');
                   navigation.navigate('RequestCreation')
                } else {
                    console.log("Ride does not exist.");
                }
            } catch (error) {
                console.error('Error updating ride status:', error);
            }
        } catch (error) {
            console.error('Payment error:', error.message);
            alert('Payment failed', error.message);
        }
    };

    const getTotalAmountForCurrentUser = (riders) => {
        const currentUserID = currentUser._id
        const currentUserRider = riders.find(rider => rider.rider === currentUserID);
        return currentUserRider ? currentUserRider.fare : 0;
    };

    return (
        <View style={styles.container}>
            {unpaidRide && (
                <Overlay isVisible={isOverlayVisible} overlayStyle={[styles.overlay, { height: 200 }]}>
                    <View style={styles.overlayContainer}>
                        <Text style={styles.title}>Pending Ride Payment</Text>
                        <Text style={{ textAlign: 'center' }}>Your have not yet paid for you ride!</Text>
                        <Text style={styles.fare}>Fare: {getTotalAmountForCurrentUser(unpaidRide.Riders)}</Text>
                        <TouchableOpacity style={styles.payNowButton} onPress={onPayNow}>
                            <Text style={styles.buttonText}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                </Overlay>
            )}
           
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContainer: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: GlobalColors.error
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

export default PayFare;