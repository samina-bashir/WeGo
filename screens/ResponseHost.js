import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { collection, query, where, doc, getDocs, getDoc, runTransaction,onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { Avatar, Icon, Input, Switch } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Modal } from 'react-native';
import Picker from '../components/Picker';
import CoriderModal from '../components/CoridersModal';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native';


const ResponseHost  = ({ route }) => {
    console.log('in responses hosts : '); 
    const { ReqId } = route.params;
    console.log('in parameter req id is : ', ReqId); //reqId is actually rider req id findHostReqId
    let hostReqId = null; 
    let updatedfare=null;
    let globalRideDoc = null;
    let globalRideRef = null;

    // console.log('in parameter HostReqId  id of host is : ', hostReqId);
    const [declinedRequests, setDeclinedRequests] = useState([]);
    const userId='FZxbp2UoJxThVSBIjIIbGEA3Z202';


    const [requests, setRequests] = useState([]);
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);

    const navigation = useNavigation();
    const [responsesHostData,setResponsesHostData]=useState([]);
    const [loading, setLoading] = useState(true);
    const [noPendingResponses, setNoPendingResponses] = useState(false);



useEffect(() => {
    const fetchResponses = async () => {
        try {
            const q = doc(collection(firestoreDB, 'responsesHost'), ReqId);
            const querySnapshot = await getDoc(q);

            if (!querySnapshot.exists()) {
                console.log('No matching document found for responses');
                setNoPendingResponses(true);
                setLoading(false)
                setResponsesHostData([]);
                return;
            }

            const response_ = querySnapshot.data().responsesHost;
            console.log(response_)
            if (response_) {
                const pendingResponses = response_.filter(res => res.status === 'pending');
                setResponsesHostData(pendingResponses);


                if (pendingResponses.length === 0) {
                    setNoPendingResponses(true);
                    setLoading(false);

                }
                else{
                    const updatedResponsesData = [];
                    for (const res of response_) {
                        const responseBy_ = res?.responseBy;
                        console.log('response by is ',responseBy_);
                        hostReqId = res?.requestId;
                        console.log(' res is  ',res )
                        const userRef = doc(firestoreDB, 'users', responseBy_);
                        const userSnapshot = await getDoc(userRef);
                        const userData = userSnapshot.exists() ? userSnapshot.data() : {};
        
                        console.log('In fetch data host id to find in ride is ',hostReqId )
                        const coriderRef = doc(firestoreDB, 'ride', 'Ri5o1r474TkoTNC0XUZ6');
                        const coriders = await getDoc(coriderRef);
                        const coR = coriders.exists() ? coriders.data().Riders : {};
        
                          //  if (userData.driver) {
                        const driverInfoRef = doc(firestoreDB, 'driverInfo', responseBy_);
                        const driverInfoSnapshot = await getDoc(driverInfoRef);
                        const driverInfo = driverInfoSnapshot.exists() ? driverInfoSnapshot.data() : {};
                     
                    
                //  }
         
        
                         // Create Firestore document reference
                 const email = userData.email;
                 const domain = email.substring(email.lastIndexOf("@") + 1);
                 const orgRef = doc(firestoreDB, 'organizations', domain);
                 console.log('orgRef is : ',orgRef)
        
                 // Get the document
                 getDoc(orgRef).then((docSnapshot) => {
                     if (docSnapshot.exists()) {
                        userData.orgName = docSnapshot.data().Name;
                         if (userData.orgName == '') {
                            userData.orgName = 'Unverified Institute'
                         }
                         console.log("Organization Name:", userData.orgName);
                     } else {
                        userData.orgName = 'Unverified Institute';
                         console.log("No organization found for domain:", domain);
                     }
                 }).catch((error) => {
                     console.error("Error getting organization:", error);
                 });
        
                 // Retrieve additional data from 'driverInfo' collection (if applicable)
        
        
        
                        updatedResponsesData.push({
                            fare: res.fare,
                            from: res.from,
                            to: res.to,
                            status: res.status,
                            responseBy:res.responseBy,
                            requestId: res.requestId,
                            hostReqId: res.requestId, //host id 
                            orgName:userData.orgName,
                            userData: userData,
                            coriders: coR,
                            driverInfo:driverInfo,
                            seats:res.seats,
                            // make:driverInfo.make,
                            // model:driverInfo.model,
                        });
                        console.log('host req id is ', hostReqId)
                    }
        
                    setResponsesHostData(updatedResponsesData);
                    setLoading(false);


                }
            } else {
                console.log('responses array not found in the document');
                setResponsesHostData([]);
                setLoading(false)
                setNoPendingResponses(true)
            }


        } catch (error) {
            console.error('Error fetching responses:', error);
        }
    };

    fetchResponses();
}, []);

// async function checkAndSetRideDoc(hostReqId) {
//     const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
//     const rideDoc = await getDoc(rideRef);

//     if (rideDoc.exists()) {
//         globalRideDoc = rideDoc;
//         globalRideRef= rideRef;
//         return true;
//     } else {
//         globalRideDoc = null;
//         globalRideRef= null;

//         return false;
//     }
// }


const updatefare = async (item) => {
    try {
        // Assuming firestoreDB is your Firestore database instance
        const findHostRequestRef = doc(collection(firestoreDB, 'findHostRequests'), ReqId);//riderid
        const findHostRequestDoc = await getDoc(findHostRequestRef);

        if (findHostRequestDoc.exists()) {
            const riderFare = findHostRequestDoc.data().fare;
            const rider_seats = findHostRequestDoc.data().seats;

            var fare;
            var hostFare;
            var host_seats=item.seats;


            // updated_seats 
            console.log('item.seats ',item.seats)
            var updated_seats;
            updated_seats=host_seats-rider_seats;


            // checkAndSetRideDoc(); //check if ride exists
            // const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
            // const rideDoc = await getDoc(rideRef);
            
            const rideRef = doc(collection(firestoreDB, 'ride'), hostReqId);
            const rideDoc = await getDoc(rideRef);
            


            if (riderFare > item.fare) { //item.fare is host ka fare
                fare = item.fare; 


                //coriders exists - ride exists  
                if(rideDoc.exists())
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
                // else 
                // {
                //         console.log('Ride document does not exist, no coriders ');
                // }
            

            } else {// if RFare<hostFare
                fare = riderFare;

                 //coriders exists - ride exists  
                 if(rideDoc.exists())
                 {
                     //decrease All R.Fare 20%
                     const rideData = rideDoc.data();
 
                         // Update fare for every rider in the Riders array 
                         const updatedRiders = rideData.Riders.map(rider => ({
                             ...rider,
                             fare: rider.fare * 0.80
                         }));
 
                         // Update the document with the modified Riders array
                         await updateDoc(rideRef, { Riders: updatedRiders });
                         console.log('Rider fares updated successfully in else part');
                 } 
                

            }

            item.fare = item.fare * 0.60;
            hostFare=item.fare;
 
                const findRiderRequestRef = doc(collection(firestoreDB, 'findRiderRequests'),  item.requestId);//host req id
                await runTransaction(firestoreDB, async (transaction) => {
                    const findRiderRequestDoc = await transaction.get(findRiderRequestRef);
                    if (findRiderRequestDoc.exists()) {
                        // transaction.update(findRiderRequestRef, { fare: hostFare });
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
        console.log('rider added')
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


        const onPressAccept = async (item) => {
            try {
                console.log('at start item is ',item);
                hostReqId=item.requestid;
                console.log('rider req id is :', ReqId)

                const requestRef = doc(firestoreDB, 'responsesHost', ReqId);//ReqId is rider's id , ddoc id of responsesHost
                await runTransaction(firestoreDB, async (transaction) => {
                    const docSnapshot = await transaction.get(requestRef);
                    if (docSnapshot.exists) {
                        const responsesHost = docSnapshot.data().responsesHost;
                        // console.log('findRiderReqId is ',item.requestId )//hostid
                        console.log('responsesHost aray ',responsesHost);
                        console.log('item req id  ',item);

                        const index = responsesHost.findIndex((response) => response.requestId === item.requestId);

                        console.log('index s :', index)

                        if (index !== -1) {
                            responsesHost[index].status = 'confirmed';
                            transaction.update(requestRef, { responsesHost });
                            console.log('Response status updated successfully!');
                            hostReqId =item.requestId;
                            console.log('Host in thi case Req ',hostReqId);
                            updatedfare = updatefare(item);
                            console.log('Result of updatefare:', updatedfare);

                          updatedfare = await updatefare(item);
                        //   console.log('item.seats are ', );


                          console.log('Result of updatefare:', updatedfare);
                          hostReqId=item.requestId;
                          console.log('host req id in accept is :', hostReqId);

                            updateRideInfo(
                                hostReqId,
                                item.from,
                                item.to,
                                item.status,
                                updatedfare, //actually updatedfare swnd krna h
                                item.responseBy,
                                
                            
                            )
                            console.log('before nav')
                             navigation.navigate('DuringRide',  { requestId: hostReqId });





                            
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
                        console.log('findRiderReqId is ',item.findRiderReqId )
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
                    {item.userData?.profilePic ? (
                        <Avatar rounded size="large" source={{ uri: item.userData?.profilePic }} />
                    ) : (
                        <Avatar rounded size={60} source={require('../assets/avatar.jpg')} />
                    )}
                    <View style={styles.hostDetails}>
                  
                        <Text style={styles.textBold}>{item.driverInfo?.make} {item.driverInfo?.model}</Text>
                        <Text style={styles.text}>{item.userData?.name}</Text>
                        <Text style={styles.textMini}>{item.userData?.gender === 0 ? 'Male' : 'Female'}</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <Icon name="star" type="material" color={'gold'} size={15} />
                            <Text style={styles.textMed}>{item.userData?.rating + ' (' + item.userData?.ratingCount + ') '}  </Text>
                        </View>
                    </View>
    
                    <View style={{ paddingRight: 10 }}>
                        <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 22, textAlign: 'center' }]}>Rs.{item.fare}</Text>
                        <TouchableOpacity
                            style={{ backgroundColor: GlobalColors.primary, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 }}
                            onPress={() => { setCoridersVisible(true); setItem(item) }}
                        >
                            <Text style={{ color: GlobalColors.background, textAlign: 'center' }}>Coriders</Text>
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
                            {item.userData?.phoneNumber && (
                                <TouchableOpacity onPress={() => { Linking.openURL(`tel:${item.userData?.phoneNumber}`) }}>
                                    <Icon name="phone-alt" type="font-awesome-5" marginTop={5} size={24} color={GlobalColors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.textBold, { marginHorizontal: 10,fontSize:13, marginBottom:3, color: item.userData?.orgName == 'Unverified Institute' ? GlobalColors.error : GlobalColors.text }]}>
                        {item.userData?.orgName}
                    </Text>
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
                    <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.error }]} onPress={() => {onPressDecline(item)
                    setDeclinedRequests(prevState => [...prevState, item.id]); // Add declined request ID
                }}>
                    
                        <Text style={[styles.textBold, { color: GlobalColors.background }]} >Decline</Text>
                    </TouchableOpacity>
    
                </View>
            </View>
        );
    

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Hosts' Responses</Text>
            {loading ? (
            
            <ActivityIndicator size="large" color={GlobalColors.primary} marginTop='120' />
        ) : noPendingResponses ? (
                <Text style={styles.noResponsesText}>No responses for now</Text>
            ) : (
            <FlatList
                data={responsesHostData}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}       />
            )}
                

        </View>


   /* <View style={styles.container}>
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
        </View> */
    )
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
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    filterButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 10,
        flexDirection: 'row'
    },
    card: {
        backgroundColor: GlobalColors.background,
        borderRadius: 10,
        padding: 5,
        marginBottom: 5,
        marginHorizontal: 10
    },
    modalText: {
        fontSize: 18,
        marginVertical: 20,
        textAlign: 'center',
        paddingHorizontal: 20
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
    hostDetails: {
        flex: 1,
    },
    textBold: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    text: {
        fontSize: 14,
    },
    textMini: {
        fontSize: 10,
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: GlobalColors.background,
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    closeButton: {
        alignSelf: 'flex-end',
    },
    modalHeading: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginHorizontal: 7
    },
    filterText: {
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 8,
        borderRadius: 5,
        textAlign: 'center'
    },
    inputContainer: {
        borderRadius: 10,
        borderColor: GlobalColors.primary,
        width: 65,
        height: 40,
        marginLeft: 2
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

export default ResponseHost;
