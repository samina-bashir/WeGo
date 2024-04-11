import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { setDoc, doc, collection, getDoc, addDoc, where, getDocs, runTransaction, updateDoc, query, FieldValue } from 'firebase/firestore'; // Make sure these imports are correct
import { firestoreDB } from '../config/firebase.config'; // Check if firestoreDB is properly imported
import { Avatar, Icon, Input, ActivityIndicator } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { useNavigation } from '@react-navigation/native';
import { Modal } from 'react-native';
import Picker from '../components/Picker';
import CoriderModal from '../components/CoridersModal';


const ResponseRider = ({ route }) => {
    const { ReqId } = route.params;

    console.log('in parameter req id is : ', ReqId);
    const hostReqId = ReqId;
    let updatedfare = null;

    console.log('in parameter HostReqId  id of host is : ', hostReqId);
    const userId = 'FZxbp2UoJxThVSBIjIIbGEA3Z202';

    const [responsesdata, setResponses] = useState([]);
    const navigation = useNavigation();
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    const [declinedRequests, setDeclinedRequests] = useState([]);


    useEffect(() => {
        const fetchResponses = async () => {
            try {
                const q = doc(collection(firestoreDB, 'responses'), ReqId);
                const querySnapshot = await getDoc(q);

                if (!querySnapshot.exists()) {
                    console.log('No matching document found for responses');
                    setResponses([]);
                    return;
                }

                const response_ = querySnapshot.data().responses;
                if (response_) {
                    setResponses(response_);
                } else {
                    console.log('responses array not found in the document');
                    setResponses([]);
                }

                const updatedResponsesData = [];
                for (const res of response_) {
                    const responseBy_ = res?.responseBy;
                    const userRef = doc(firestoreDB, 'users', responseBy_);
                    const userSnapshot = await getDoc(userRef);
                    const userData = userSnapshot.exists() ? userSnapshot.data() : {};
                    const coriderRef = doc(firestoreDB, 'ride', ReqId);
                    const coriders = await getDoc(coriderRef);
                    const coR = coriders.exists() ? coriders.data().Riders : {};

                    updatedResponsesData.push({
                        fare: res.fare,
                        from: res.from,
                        to: res.to,
                        status: res.status,
                        requestId: res.requestId,
                        userData: userData,
                        coriders: coR
                    });
                }

                setResponses(updatedResponsesData);
            } catch (error) {
                console.error('Error fetching responses:', error);
            }
        };

        fetchResponses();
    }, []);



    //     async function updateRideInfo(
    //         hostReqId,
    //         updatedFare,
    //         itemFrom,
    //         itemTo,
    //         itemStatus,
    //         itemResponseBy
    //       ) {
    //         const rideRef = collection(firestoreDB, "ride");

    //         // Check if document exists with matching hostReqId
    //         try {
    //           const querySnapshot = await getDocs(query(rideRef, where("id", "==", hostReqId)));
    //           const rideDoc = querySnapshot.docs[0];

    //           if (rideDoc) {
    //             // Document exists, update Riders array
    //             console.log('RDoc exists !!!');

    //             const newRideData = {
    //               fare: updatedFare,
    //               from: itemFrom,
    //               to: itemTo,
    //               paid: false,
    //               rider: itemResponseBy,
    //               status: itemStatus === "pending" ? "inProgress" : itemStatus,
    //             };

    //             await updateDoc(rideDoc.ref, {
    //               Riders: FieldValue.arrayUnion(newRideData),

    //             });

    //             console.log('UpdateDoc !');

    //             // Fetch additional data from findRidersRequests collection
    //             const findRidersRequestsRef = collection(firestoreDB, "findRiderRequests");
    //             const findRidersQuerySnapshot = await getDocs(
    //               query(findRidersRequestsRef, where("docId", "==", hostReqId))
    //             );
    //             const findRidersDoc = findRidersQuerySnapshot.docs[0];

    //             const to = findRidersDoc.data().to;
    //             const from = findRidersDoc.data().from;
    //             const host = findRidersDoc.data().createdBy;

    // await updateDoc(rideDoc.ref, {
    //     Riders: FieldValue.arrayUnion(newRideData),
    //     to: to, 
    //     from: from,
    //     Host: host, 
    //   });

    //   console.log('UpdateDoc !');    
    //  } 
    //   else {
    //             try {
    //               // Fetch data from findRidersRequests collection first
    //               const findRidersRequestsRef = collection(firestoreDB, "findRiderRequests");
    //               const findRidersQuerySnapshot = await getDocs(
    //                 query(findRidersRequestsRef, where("docId", "==", hostReqId))
    //               );
    //               const findRidersDoc = findRidersQuerySnapshot.docs[0];

    //               const from = findRidersDoc.data().from;
    //               const to = findRidersDoc.data().to;
    //               const host = findRidersDoc.data().createdBy;

    //               // Create the new document with fetched values
    //               const newRideDoc = await addDoc(rideRef, {
    //                 id: hostReqId,
    //                 fare: updatedFare, // Corrected: use updatedFare instead of from
    //                 from: from, // Use fetched 'from' value
    //                 to: to, // Use fetched 'to' value
    //                 Host: host, // Use fetched 'host' value
    //                 Riders: [
    //                   {
    //                     fare: updatedFare,
    //                     from: itemFrom,
    //                     to: itemTo,
    //                     paid: false,
    //                     rider: itemResponseBy,
    //                     status: itemStatus === "pending" ? "inProgress" : itemStatus,
    //                   },
    //                 ],
    //               });

    //               // ... (rest of your code)

    //             } catch (error) {
    //               console.error("Error fetching or creating ride:", error);
    //             }
    //           }
    //         } catch (error) {
    //           console.error("Error updating ride info:", error);
    //         }
    //       }

    // async function updateRideInfo(hostReqId, updatedFare, from, to, status, responseBy) {
    //   const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
    //   const rideDoc = await getDoc(rideRef);

    //   if (rideDoc.exists()) {
    //     const rideData = rideDoc.data();
    //     const updatedRiders = [...rideData.Riders, {
    //       from: from,
    //       to: to,
    //       fare: updatedFare,
    //       status: status === 'pending' ? 'inProgress' : status,
    //       paid: false,
    //       rider: responseBy
    //     }];

    //     await setDoc(rideRef, { Riders: updatedRiders }, { merge: true });
    //   } else {
    //     const findRiderReqDoc = await getDoc(doc(collection(firestoreDB, 'findRiderRequests'), hostReqId));
    //     if (findRiderReqDoc.exists()) {
    //       const data = findRiderReqDoc.data();
    //       await setDoc(rideRef, {
    //         from: data.from,
    //         to: data.to,
    //         Host: data.createdBy,
    //         fare: updatedFare,
    //         Riders: [{
    //           from: from,
    //           to: to,
    //           fare: updatedFare,
    //           status: status === 'pending' ? 'inProgress' : status,
    //           paid: false,
    //           rider: responseBy
    //         }]
    //       });
    //     } else {
    //       console.log(`No document found with id ${hostReqId} in findRiderRequests collection.`);
    //     }
    //   }
    // }


    // async function updateRideInfo(hostReqId, itemfrom, itemto, itemstatus, updatedFare, responseBy) {
    //   const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
    //   const rideDoc = await getDoc(rideRef);

    //   if (rideDoc.exists()) {
    //     const rideData = rideDoc.data();
    //     const updatedRiders = [...rideData.Riders, {
    //       from: itemfrom,
    //       to: itemto,
    //       fare: updatedFare,
    //       status: itemstatus === 'pending' ? 'inProgress' : itemstatus,
    //       paid: false,
    //       rider: responseBy
    //     }];

    //     const findRiderReqDoc = await getDoc(doc(collection(firestoreDB, 'findRiderRequests'), hostReqId));
    //     if (findRiderReqDoc.exists()) {
    //       const data = findRiderReqDoc.data();
    //       await setDoc(rideRef, {
    //         from: data.from,
    //         to: data.to,
    //         Host: data.createdBy,
    //         Riders: updatedRiders

    //       });
    //     } else {
    //       console.log(`No document found with id ${hostReqId} in findRiderRequests collection.`);
    //     }
    //   } else {
    //     const findRiderReqDoc = await getDoc(doc(collection(firestoreDB, 'findRiderRequests'), hostReqId));
    //     if (findRiderReqDoc.exists()) {
    //       const data = findRiderReqDoc.data();
    //       await setDoc(rideRef, {
    //         from: data.from,
    //         to: data.to,
    //         Host: data.createdBy,
    //         Riders: [{
    //           from: itemfrom,
    //           to: itemto,
    //           status: itemstatus === 'pending' ? 'inProgress' : itemstatus,
    //           fare: updatedFare,
    //           paid: false,
    //           rider: responseBy
    //         }]
    //       });
    //     } else {
    //       console.log(`No document found with id ${hostReqId} in findRiderRequests collection.`);
    //     }
    //   }
    // }


    async function updateRideInfo(hostReqId, itemfrom, itemto, itemstatus, updatedFare, responseBy) {
        const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
            const rideData = rideDoc.data();
            const updatedRiders = [...rideData.Riders, {
                from: itemfrom,
                to: itemto,
                status: itemstatus === 'pending' ? 'inProgress' : itemstatus,
                fare: updatedFare,
                paid: false,
                rider: responseBy
            }];

            await updateDoc(rideRef, { Riders: updatedRiders });
            console.log('ride added')
        } else {
            const findRiderReqDoc = await getDoc(doc(collection(firestoreDB, 'findRiderRequests'), hostReqId));
            if (findRiderReqDoc.exists()) {
                const data = findRiderReqDoc.data();
                await setDoc(rideRef, {
                    from: data.from,
                    to: data.to,
                    Host: data.createdBy,
                    Riders: [{
                        from: itemfrom,
                        to: itemto,
                        status: itemstatus === 'pending' ? 'inProgress' : itemstatus,
                        fare: updatedFare,
                        paid: false,
                        rider: responseBy
                    }]
                });
                console.log('done')
            } else {
                console.log(`No document found with id ${hostReqId} in findRiderRequests collection.`);
            }
        }
    }



    const updatefare = async (item) => { //item.fare is riderfare
        try {
            // Assuming firestoreDB is your Firestore database instance
            const findRiderRequestRef = doc(collection(firestoreDB, 'findRiderRequests'), ReqId);
            const findRiderRequestDoc = await getDoc(findRiderRequestRef);

            if (findRiderRequestDoc.exists()) {
                let hostFare = findRiderRequestDoc.data().fare;
                let fare;
                fare = hostFare;
                hostFare = hostFare * 0.60;  //decrease 60% host fare for 

                const findRiderRequestRef = doc(collection(firestoreDB, 'findRiderRequests'), ReqId);
                await runTransaction(firestoreDB, async (transaction) => {
                    const findRiderRequestDoc = await transaction.get(findRiderRequestRef);
                    if (findRiderRequestDoc.exists()) {
                        transaction.update(findRiderRequestRef, { fare: hostFare });
                    } else {
                        console.log('findRiderRequest document does not exist.');
                    }
                });

                return fare;
            } else {
                console.log('Host request document does not exist.');
                return null; // or any default value indicating failure
            }
        } catch (error) {
            console.error('Error updating fare:', error);
            return null; // or any default value indicating failure
        }
    };


    const onPressAccept = async (item) => {
        try {
            const requestRef = doc(firestoreDB, 'responses', ReqId);
            await runTransaction(firestoreDB, async (transaction) => {
                const docSnapshot = await transaction.get(requestRef);
                if (docSnapshot.exists) {
                    const responses = docSnapshot.data().responses;
                    const index = responses.findIndex((response) => response.requestId === item.requestId);
                    if (index !== -1) {
                        responses[index].status = 'confirmed';
                        transaction.update(requestRef, { responses });
                        console.log('Response status updated successfully!');

                        updatedfare = updatefare(item);
                        console.log('Result of updatefare:', updatedfare);

                        updateRideInfo(
                            hostReqId,
                            item.from,
                            item.to,
                            item.status,
                            updatedfare, //actually updatedfare swnd krna h
                            item.responseBy
                        )

                        navigation.navigate('DuringRideHost', {requestId: ReqId})
                    } else {
                        console.log('Response not found in the array.');
                    }
                } else {
                    console.log('Document does not exist.');
                }
            });
        } catch (error) {
            console.error('Error updating response status:', error);
        }



    };


    const onPressDecline = async (item) => {
        try {
            const requestRef = doc(firestoreDB, 'responsesHost', ReqId);
            await runTransaction(firestoreDB, async (transaction) => {
                const docSnapshot = await transaction.get(requestRef);
                if (docSnapshot.exists) {
                    const responsesHost = docSnapshot.data().responsesHost;
                    console.log('findRiderReqId is ', item.findRiderReqId)
                    const index = responsesHost.findIndex((response) => response.findRiderReqId === item.findRiderReqId);
                    if (index !== -1) {
                        responsesHost[index].status = 'rejected';
                        transaction.update(requestRef, { responsesHost });
                        console.log('Response status updated successfully!');

                        setDeclinedRequests(prevRides => prevRides.filter(ride => ride.findRiderReqId !== item.findRiderReqId));


                    } else {
                        console.log('Response not found in the array.');
                    }
                } else {
                    console.log('Document does not exist.');
                }
            });
        } catch (error) {
            console.error('Error updating response status:', error);
        }
    };





    const renderRequestItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.profileSection}>
                {item.userData?.profilePic ? (<Avatar rounded size="large" source={{ uri: item.userData?.profilePic }} />)
                    : (
                        <Avatar rounded size={60} source={require('../assets/avatar.jpg')} />
                    )}
                <View style={styles.riderDetails}>
                    <Text style={styles.text}>{item.userData?.name}</Text>
                    <Text style={styles.textMini}>{item.userData?.gender === 0 ? 'Male' : 'Female'}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="star" type="material" color={'gold'} size={15} />
                        <Text style={styles.textMed}>{item.userData?.rating + ' (' + item.userData?.ratingCount + ') '}  </Text>
                    </View>
                </View>
                <View style={{ paddingRight: 10 }}>
                    <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 22, textAlign: 'center' }]}>Rs.{item.fare}</Text>
                    <TouchableOpacity style={{ backgroundColor: GlobalColors.primary, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 }} onPress={() => { setCoridersVisible(true); setItem(item) }}>
                        <Text style={{ color: GlobalColors.background, textAlign: 'center' }}>
                            Coriders
                        </Text>
                    </TouchableOpacity>
                    <CoriderModal
                        visible={coridersVisible}
                        coriders={selectedItem?.coriders}
                        onClose={() => setCoridersVisible(false)}
                    />
                    <View style={styles.callChatIcons}>
                        <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', item.userData) }}>
                            <Icon name="comment-dots" type="font-awesome-5" marginTop={5} size={26} color={GlobalColors.primary} />
                        </TouchableOpacity>
                        {item.userData?.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${item.userData?.phoneNumber}`) }}>
                            <Icon name="phone-alt" type="font-awesome-5" marginTop={5} size={24} color={GlobalColors.primary} />
                        </TouchableOpacity>}
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row' }}>

                {/* <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginLeft: 'auto' }}>
                    <Text style={[styles.preferences, { textDecorationLine: item.music ? 'none' : 'line-through' }]}>Music</Text>
                    <Text style={[styles.preferences, { textDecorationLine: item.ac ? 'none' : 'line-through' }]}>AC</Text>
                </View> */}
            </View>
            <View style={{ paddingHorizontal: 10 }}>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                    <Text style={styles.text}> From: {item.from} </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                    <Text style={styles.text}> To: {item.to} </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row' }}>

                <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.accept }]}
                    onPress={() => onPressAccept(item)}
                >


                    <Text style={[styles.textBold, { color: GlobalColors.background }]}>Accept</Text>

                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.error }]}
                    onPress={() => {
                        onPressDecline(item)
                        setDeclinedRequests(prevState => [...prevState, item.id]); // Add declined request ID
                    }}>

                    <Text style={[styles.textBold, { color: GlobalColors.background }]}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Riders' Responses</Text>
            <FlatList
                data={responsesdata}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 30,
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 30,
        color: GlobalColors.primary,
        marginTop: '7%',
        paddingHorizontal: 20
    },
    card: {
        backgroundColor: GlobalColors.background,
        borderRadius: 10,
        padding: 5,
        marginBottom: 5,
        marginHorizontal: 10
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: 10,
        marginHorizontal: 2,
    },
    riderDetails: {
        flex: 1,
    },
    textBold: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    text: {
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    textMini: {
        fontSize: 10,
        marginLeft: 9,
        // color:GlobalColors.tertiary,

    },
    textMed: {
        fontSize: 12,

    },
    callChatIcons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    preferences: {
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        fontStyle: 'italic'
    },
});

export default ResponseRider;