import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { setDoc, doc, collection, getDoc, addDoc, where, getDocs, runTransaction, updateDoc, query, FieldValue } from 'firebase/firestore'; // Make sure these imports are correct
import { firestoreDB } from '../config/firebase.config'; // Check if firestoreDB is properly imported
import { Avatar, Icon, Input } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { ActivityIndicator } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Modal } from 'react-native';
import Picker from '../components/Picker';
import CoriderModal from '../components/CoridersModal';


const ResponseRider = ({ route }) => {

    const { ReqId } = route.params;  //HOST REQ ID FINDrIDERREQ DOC ID //RIDER REQ ID ITEM.REQUESTiD


    const hostReqId = ReqId;
    let updatedfare = null;

 
    const userId = 'FZxbp2UoJxThVSBIjIIbGEA3Z202';

    const [responsesdata, setResponses] = useState([]);
    const navigation = useNavigation();
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    const [declinedRequests, setDeclinedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noPendingResponses, setNoPendingResponses] = useState(false);
    

    useEffect(() => {
        const fetchResponses = async () => {
            try {
                const q = doc(collection(firestoreDB, 'responses'), ReqId);
                const querySnapshot = await getDoc(q);

                if (!querySnapshot.exists()) {
                    setLoading('false')
                    console.log('No matching document found for responses');
                    console.log("faslie")
                    setNoPendingResponses(true);
                    setResponses([]);
                    return;
                }

                const response_ = querySnapshot.data().responses;
                console.log(response_)
                if (response_) {
                    console.log(response_)
                    const pendingResponses = response_.filter(res => res.status === 'pending');
                    setResponses(pendingResponses);

                    if (pendingResponses.length === 0) {
                        setNoPendingResponses(true);
                        setLoading(false);
                        console.log('no response')
                    }
                    else{
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
                                responseBy:res.responseBy,
                                userData: userData,
                                coriders: coR,
                                // currently:res.currently,
                                seats:res.seats,
                                timestamp:res.timestamp
        
                            });
                        }
                           setResponses(updatedResponsesData);
                    setLoading(false);

                    }
                 

                } else {
                    console.log('responses array not found in the document');
                    setResponses([]);
                    setLoading(false)
                    setNoPendingResponses(true);
                }

               
            } catch (error) {
                console.error('Error fetching responses:', error);
            }
            // finally{
            //     setLoading(false);
            // }
        };
    

        fetchResponses();
    }, [ReqId]);

    useEffect(()=>{
        console.log('l',loading)
        console.log('np',noPendingResponses)
    },[loading, noPendingResponses])

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
                console.log({
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
                })
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
            const findRiderRequestRef = doc(collection(firestoreDB, 'findRiderRequests'), hostReqId);
            const findRiderRequestDoc = await getDoc(findRiderRequestRef);

            if (findRiderRequestDoc.exists()) {

                var hostFare = findRiderRequestDoc.data().fare;
                var host_seats=findRiderRequestDoc.data().seats;
                var fare;
                fare = hostFare;
                hostFare = hostFare * 0.60;  //decrease 60% host fare for 

                //update seats 
                console.log('item.seats ',item.seats)
                console.log('item ')
                var updated_seats;
                updated_seats=host_seats-item.seats;


               

                //if coriders exist
                const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
                const rideDoc = await getDoc(rideRef);
                
                if (rideDoc.exists())
                {
                        //decrease All R.Fare 60%
                        const rideData = rideDoc.data();
    
                            // Update fare for every rider in the Riders array
                            const updatedRiders = rideData.Riders.map(rider => ({
                                ...rider,
                                fare: rider.fare * 0.60
                            }));
    
                            // Update the document with the modified Riders array
                            await updateDoc(rideRef, { Riders: updatedRiders });
                            console.log('Rider fares updated successfully');
                }
                else{console.log('Ride doesnt exist prior')}

                
                

                const findRiderRequestRef = doc(collection(firestoreDB, 'findRiderRequests'), ReqId);
                await runTransaction(firestoreDB, async (transaction) => {
                    const findRiderRequestDoc = await transaction.get(findRiderRequestRef);
                    if (findRiderRequestDoc.exists()) {
                        // transaction.update(findRiderRequestRef, { fare: hostFare });

                        const updateData = { fare: hostFare, seats: updated_seats };
                        if (updated_seats < 1) {
                            updateData.currently = 'closed';
                            updateData.seats = 0;

                        }
                        // Perform the update
                        transaction.update(findRiderRequestRef, updateData);
                    } else {
                        console.log('findRiderRequest document does not exist.');
                    }
                });




                console.log('fare is ', fare )
                console.log('host fare is ', hostFare )

                return Math.floor(fare);
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
            console.log('In onPressAccept?')
            console.log('at start itemmm ',item)

            const requestRef = doc(firestoreDB, 'responses', ReqId);//Reqid is Host's Reqid in responses docid=Hostsid=FindRiderReq doc id
            await runTransaction(firestoreDB, async (transaction) => {
                const docSnapshot = await transaction.get(requestRef);
                if (docSnapshot.exists) {
                    const responses = docSnapshot.data().responses;
                    const index = responses.findIndex((response) => response.requestId === item.requestId);
                    if (index !== -1) {
                        responses[index].status = 'confirmed';

                        transaction.update(requestRef, { responses });
                        // console.log('Response status updated successfully!');
                        // console.log('item fare ', item.fare)
                        console.log('item seats ', item.seats)

                        updatedfare = await updatefare(item);
                        console.log('Result of updatefare:', updatedfare);

                        console.log('responseBy ',item.responseBy)
                        console.log('item  ',item)

                        updateRideInfo(
                            hostReqId,
                            item.from,
                            item.to,
                            item.status,
                            updatedfare, //actually updatedfare swnd krna h
                            item.responseBy,
                            
                        
                        )

                        navigation.navigate('DuringRideHost', { requestId: hostReqId})

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
            console.log('item in decline is ',item);
            const requestRef = doc(firestoreDB, 'responses', ReqId); // ReqId is Host's ReqId in responses docid=Hostsid=FindRiderReq doc id
            await runTransaction(firestoreDB, async (transaction) => {
                const docSnapshot = await transaction.get(requestRef);
                if (docSnapshot.exists()) {
                    const responses = docSnapshot.data().responses;
                    const index = responses.findIndex((response) => response.requestId === item.requestId);
                    if (index !== -1) {
                        responses[index].status = 'rejected';
                        transaction.update(requestRef, { responses });
    
                        // Remove the declined request from the responsesdata state
                        setResponses(prevResponses => prevResponses.filter(response => response.requestId !== item.requestId));
    
                        console.log('Response status updated to rejected successfully!');
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
                    <Text style={styles.text}> From: {item.from.name} </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                    <Text style={styles.text}> To: {item.to.name} </Text>
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
        // <View style={styles.container}>
        //     <Text style={styles.heading}>Riders' Responses</Text>
        //     <FlatList
        //         data={responsesdata}
        //         renderItem={renderRequestItem}
        //         keyExtractor={item => item.id}
        //     />
        // </View>
        <View style={styles.container}>
        <Text style={styles.heading}>Riders' Responses</Text>
        {loading ? (
            
            <ActivityIndicator size="large" color="#0c2442" marginTop='120' />
        ) : noPendingResponses ? (
                <Text style={styles.noResponsesText}>No responses for now</Text>
            ) : (
                <FlatList
                    data={responsesdata}
                    renderItem={renderRequestItem}
                    keyExtractor={item => item.requestId}
                />
            )}
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
        // fontWeight: 'bold',
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
    noResponsesText:{
        color:GlobalColors.secondary,
        justifyContent:'center',
        alignItems:'center',
        fontWeight:'bold',
        margin:'15%',
        marginTop:'60%',
        fontSize:25,

    }
});

export default ResponseRider;
