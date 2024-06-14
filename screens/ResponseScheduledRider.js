//in project
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


const ResponseScheduledRider = ({ route }) => {
    const { ReqId, riderId } = route.params;

    console.log('in parameter req id is : ', ReqId);
    const hostReqId = ReqId;
    var updatedfare = null;

    console.log('in parameter HostReqId  id of host is : ', hostReqId);

    const [responsesdata, setResponses] = useState([]);
    const navigation = useNavigation();
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    const [declinedRequests, setDeclinedRequests] = useState([]);
    const [isContainerVisible, setContainerVisible] = useState(true);
    const [noPendingResponses, setNoPendingResponses] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentUser = useSelector((state) => state.user.user);
    const userId = currentUser?._id
    useEffect(() => {
        const fetchResponses = async () => {
            setLoading(true)
            try {
                const q = doc(collection(firestoreDB, 'responsesScheduledRider'), ReqId);//ReqId is host id
                const querySnapshot = await getDoc(q);

                if (!querySnapshot.exists()) {
                    console.log('No matching document found for responses');
                    setNoPendingResponses(true);
                    setResponses([]);
                    setLoading(false)
                    return;
                }

                const response_ = querySnapshot.data().responsesScheduledRider;
                if (response_) {
                    const pendingResponses = response_.filter(res => res.status === 'pending');
                    setResponses(pendingResponses);

                    
                    if (pendingResponses.length === 0) {
                        setNoPendingResponses(true);
                        setLoading(false);

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
                                fare: Math.floor(res.fare),
                                from: res.from,
                                to: res.to,
                                status: res.status,
                                requestId: res.requestId,
                                responseBy:res.responseBy,
                                userData: userData,
                                coriders: coR,
                                seats:res.seats,
                            });
                        }
        
                        setResponses(updatedResponsesData);
                        setLoading(false);


                    }
                } 
                else {
                    console.log('responses array not found in the document');
                    setResponses([]);
                    setLoading(false)
                    setNoPendingResponses(true)
                }
                

           
            } catch (error) {
                console.error('Error fetching responses:', error);
            }
        };

        fetchResponses();
    }, []);


    const AddToRider = async (item) => {
        try{
        const rideRef = doc(firestoreDB, "ride", item.requestId);
        await runTransaction(firestoreDB, async (transaction) => {
          const docSnapshot = await transaction.get(rideRef);
          if (docSnapshot.exists) {
            let previousRiders = docSnapshot.data()?.Riders
            let isPresent= false
            if(previousRiders){
                previousRiders.forEach(element => {
                    if(element.rider == riderId)
                    isPresent = true
                });
                console.log('first if ')
            }
            if(!isPresent){
            const newRideData = {
              fare: Math.floor(item.fare),
              from: item.from,
              to: item.to,
              paid: false,
              rider: item.responseBy,
              status: item.status,
            };
            try{
                await updateDoc(docSnapshot.ref, {
                    Riders: previousRiders ? [ ...previousRiders, newRideData] : [newRideData],
                  }).catch((error)=>{
                    if(error.toString().includes('not-found')){
                         setDoc(doc(firestoreDB, "ride", item.requestId),  {
                            Host:riderId,
                            Riders: [newRideData],
                          })
                    }
                  })
                  console.log('added by add to rider')
            }catch(error){
                console.log(error)
                alert("Failed : "+ error)
            }
        }
          }
        });
        }catch (error){
            alert("Failed: "+ error)
        }
      };
   


    async function updateRideInfo(hostReqId, itemfrom, itemto, itemstatus, updatedFare, responseBy) {
        const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
            const rideData = rideDoc.data();
            const updatedRiders = [...rideData.Riders, {
                from: itemfrom,
                to: itemto,
                status: itemstatus === 'pending' ? 'inProgress' : itemstatus,
                fare: Math.floor(updatedFare),
                paid: false,
                rider: responseBy
            }];

            await updateDoc(rideRef, { Riders: updatedRiders });
            console.log('ride added by updaterideinfo')
        } else {
            const findRiderReqDoc = await getDoc(doc(collection(firestoreDB, 'findScheduledRiderRequests'), hostReqId));
            if (findRiderReqDoc.exists()) {
                const data = findRiderReqDoc.data();
                await setDoc(rideRef, {
                    from: data.from,
                    to: data.to,
                    Host: currentUser?._id,
                    Riders: [{
                        from: itemfrom,
                        to: itemto,
                        status: itemstatus === 'pending' ? 'inProgress' : itemstatus,
                        fare: updatedFare,
                        paid: false,
                        rider: responseBy
                    }]
                });
                console.log('done by updaterideinfo')
            } else {
                console.log(`No document found with id ${hostReqId} in findScheduledRiderRequests collection.`);
            }
        }
    }



    const updatefare = async (item) => { //item.fare is riderfare
        try {
            // Assuming firestoreDB is your Firestore database instance
            const findRiderRequestRef = doc(collection(firestoreDB, 'findScheduledRiderRequests'), hostReqId);
            const findRiderRequestDoc = await getDoc(findRiderRequestRef);

            if (findRiderRequestDoc.exists()) {

                var hostFare = findRiderRequestDoc.data().fare;
                var host_seats=findRiderRequestDoc.data().seats;
                var fare;
                fare = hostFare;
                hostFare = hostFare * 0.60;  //decrease 60% host fare for 

                //update seats 
                console.log('item.seats ',item.seats)
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
                                fare: Math.floor(rider.fare * 0.60)
                            }));
    
                            // Update the document with the modified Riders array
                            await updateDoc(rideRef, { Riders: updatedRiders });
                            console.log('Rider fares updated successfully');
                }
                else{console.log('Ride doesnt exist prior')}

                
                

                const findRiderRequestRef = doc(collection(firestoreDB, 'findScheduledRiderRequests'), ReqId);
                await runTransaction(firestoreDB, async (transaction) => {
                    const findRiderRequestDoc = await transaction.get(findRiderRequestRef);
                    if (findRiderRequestDoc.exists()) {
                        // transaction.update(findRiderRequestRef, { fare: hostFare });

                        const updateData = { fare: hostFare, seats: updated_seats };
                        if (updated_seats < 1) {
                            updateData.currently = 'closed';
                        }
                        // Perform the update
                        transaction.update(findRiderRequestRef, updateData);
                    } else {
                        console.log('findRiderRequest document does not exist.');
                    }
                });




                console.log('fare is ', fare )
                console.log('host fare is ', hostFare )

                var int_fare;
                int_fare=Math.floor(fare)
                return int_fare

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
            const requestRef = doc(firestoreDB, 'responsesScheduledRider', ReqId);
            await runTransaction(firestoreDB, async (transaction) => {
                const docSnapshot = await transaction.get(requestRef);
                if (docSnapshot.exists) {
                    const responsesScheduledRider = docSnapshot.data().responsesScheduledRider;
                    const index = responsesScheduledRider.findIndex((response) => response.requestId === item.requestId);
                    if (index !== -1) {
                        responsesScheduledRider[index].status = 'confirmed';
                        transaction.update(requestRef, { responsesScheduledRider });
                        console.log('Response status updated successfully!');

                        updatedfare = await updatefare(item);
                        console.log('Result of updatefare:', updatedfare);

                        updateRideInfo(
                            hostReqId,
                            item.from,
                            item.to,
                            item.status,
                            updatedfare, //actually updatedfare swnd krna h
                            item.responseBy
                        )
                        // AddToRider(item)
                        // navigation.navigate('DuringRideHost', {requestId: ReqId})
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



   
    //     try {
            
    //         const requestRef = doc(firestoreDB, 'responsesScheduledRider', ReqId);
    //         await runTransaction(firestoreDB, async (transaction) => {
    //             const docSnapshot = await transaction.get(requestRef);
    //             if (docSnapshot.exists) {
    //                 const responsesHost = docSnapshot.data().responsesHost;
    //                 console.log('findRiderReqId is ', item.requestId)
    //                 const index = responsesHost.findIndex((response) => response.requestId === item.requestId);
    //                 if (index !== -1) {
    //                     responsesHost[index].status = 'rejected';
    //                     transaction.update(requestRef, { responsesHost });
    //                     console.log('Response status updated successfully!');

    //                     setDeclinedRequests(prevRides => prevRides.filter(ride => ride.requestId !== item.requestId));


    //                 } else {
    //                     console.log('Response not found in the array.');
    //                 }
    //             } else {
    //                 console.log('Document does not exist.');
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error updating response status:', error);
    //     }
    // };
    const onPressDecline = async (item) => {
        try {
            console.log('item in decline is ',item);
            const requestRef = doc(firestoreDB, 'responsesScheduledRider', ReqId);
            await runTransaction(firestoreDB, async (transaction) => {
                const docSnapshot = await transaction.get(requestRef);
                if (docSnapshot.exists()) {
                    const responses = docSnapshot.data().responsesScheduledRider;
                    console.log('responses',responses);
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
                        onPressDecline()
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
            {loading ? (
            <ActivityIndicator size="large" color="#0c2442" marginTop='120' />
        ) : noPendingResponses ? (
                <Text style={styles.noResponsesText}>No responses for now</Text>
            ) : (
            <FlatList
                data={responsesdata}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}
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
        noResponsesText:{
        color:GlobalColors.primary,
        justifyContent:'center',
        alignItems:'center',
        fontWeight:'bold',
        margin:120,
        marginTop:350,
        fontSize:15,

    }
});

export default ResponseScheduledRider;
