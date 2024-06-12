import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { collection, query, where, doc, getDocs, getDoc, onSnapshot, setDoc, updateDoc, documentId, Timestamp } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { Avatar, Icon, Input, Switch } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Modal } from 'react-native';
import Picker from '../components/Picker';
import CoriderModal from '../components/CoridersModal';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native';

const FindHostScreen = () => {
    const myReqData = useRoute()?.params
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const navigation = useNavigation();
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState({
        ac: false,
        music: false,
        coriders: true,
    });
    const [ratingRange, setRatingRange] = useState([0, 5]);
    const [fareRange, setFareRange] = useState([0, 50000]);
    const [gender, setGender] = useState('none');
    const [coridersVisible, setCoridersVisible] = useState(false);
    const [selectedItem, setItem] = useState(null);
    const [declinedRequests, setDeclinedRequests] = useState([]);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const currentUser = useSelector((state) => state.user.user);
    // { _id: 'FZxbp2UoJxThVSBIjIIbGEA3Z202' }
    const response = {
        requestId: myReqData?.id,
        fare: myReqData?.fare,
        from: myReqData?.from,
        responseBy: currentUser?._id,
        status: "pending",
        to: myReqData?.to,
        seats: myReqData?.seats

    };

    const chechkWayPoints = async(fromLat, toLat, fromLong, toLong, routeTime, routeDistance, onSuccess) => {
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append(
                "X-Goog-Api-Key",
                "AIzaSyDdZWM3zDQP-5iY5iinSE9GU858bjFoNf8"
            );
            myHeaders.append(
                "X-Goog-FieldMask",
                "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
            );

            const raw = JSON.stringify({
                origin: { location: { latLng: { latitude: fromLat, longitude: fromLong } } },
                destination: { location: { latLng: { latitude: toLat, longitude: toLong } } },
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE",
                computeAlternativeRoutes: false,
                languageCode: "en-US",
                units: "IMPERIAL",
                intermediates: [
                    { location: { latLng: { latitude: myReqData?.from?.latitude, longitude: myReqData?.from?.longitude } } },
                    { location: { latLng: { latitude: myReqData?.to?.latitude, longitude: myReqData?.to?.longitude } } }
                ]
            });
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };

            const apiResponse = await fetch(
                "https://routes.googleapis.com/directions/v2:computeRoutes",
                requestOptions
            )
            const result = await apiResponse.json()

            if (result.routes && result.routes.length > 0) {
                // alert(parseInt(myReqData?.routeTime) +" : "+ parseInt(result?.routes?.[0]?.duration?.split('s')?.[0]))
                console.log(result);
                console.log(routeTime);
                let threshHold = 0
                let extraTime = 0
                console.log(parseInt(result?.routes[0]?.duration?.split('s')[0]))
                extraTime = (parseInt(result?.routes[0]?.duration?.split('s')[0]) - routeTime)
                threshHold = (parseInt(result?.routes[0]?.duration?.split('s')[0]) - routeTime) * 100 / routeTime
                // alert(myReqData?.routeTime +"  - "+ parseInt(result?.routes?.[0]?.duration?.split('s')?.[0]) +" : "+  myReqData?.routeTime )
                // alert(" th "+Math.round(threshHold))
                var threshHoldDistance =( result?.routes[0]?.distanceMeters / 1000 - routeDistance )* 100 / routeDistance;
                console.log('thresh', threshHold);
                console.log('extra', threshHoldDistance)
                if (Math.round(threshHold) < 65 || Math.round(threshHoldDistance) < 20) {

                    console.log('finallyy')
                    await onSuccess(extraTime)
                } else {
                    console.log('request not upto mark!')
                    return
                }
            } else {
                console.log('result not ok', result)
            }


        } catch (error) {
            alert("error new 2" + error)
        }
    }

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true)
            // const requestsCollection = collection(firestoreDB, 'findRiderRequests');
            // const q = query(requestsCollection);

            // const querySnapshot = await getDocs(q);
            const requestsCollection = collection(firestoreDB, 'findRiderRequests');
            const userId = currentUser?._id;
            const x = myReqData?.timestamp.toDate()?.getTime() - 60 * 60000;
            const adjustedDate = new Date(x)
            const q = query(requestsCollection, where('timestamp', '>', Timestamp.fromDate(adjustedDate)), where('createdBy', '!=', userId), where('currently', '==', 'active'), where('seats','>=',myReqData?.seats));
            const querySnapshot = await getDocs(q)


            var requestsData = [];
            console.log('hi', querySnapshot?.docs)
            if (querySnapshot?.docs.length == 0) {
                setIsLoading(false)
                console.log('no match found')
            }


            for (const document of querySnapshot.docs) {
                const requestData = document.data();
                if (requestData?.from?.latitude && requestData?.to?.latitude && requestData?.from?.longitude && requestData?.to?.longitude && requestData?.routeTime) {
                    await chechkWayPoints(
                        requestData.from.latitude,
                        requestData.to.latitude,
                        requestData.from.longitude,
                        requestData.to.longitude,
                        requestData?.routeTime,
                        requestData?.routeDistance,
                        async (extraTime) => {
                            console.log('passed thresh check')
                            const createdBy = requestData?.createdBy;

                            // Retrieve additional data from 'users' collection
                            const userRef = doc(firestoreDB, 'users', createdBy);
                            const userSnapshot = await getDoc(userRef);
                            requestData.userData = userSnapshot.exists() ? userSnapshot.data() : {};

                            const coriderRef = doc(firestoreDB, 'ride', document?.id);
                            try {
                                const coriders = await getDoc(coriderRef);
                                requestData.coriders = coriders.exists() ? coriders.data()?.Riders : [];
                            } catch (error) {
                                console.error(error);
                            }

                            const email = requestData.userData.email;
                            const domain = email.substring(email?.lastIndexOf("@") + 1);
                            const orgRef = doc(firestoreDB, 'organizations', domain);

                            try {
                                const docSnapshot = await getDoc(orgRef);
                                requestData.userData.orgName = docSnapshot.exists() ? docSnapshot.data()?.Name : 'Unverified Institute';
                            } catch (error) {
                                console.error("Error getting organization:", error);
                                requestData.userData.orgName = 'Unverified Institute';
                            }

                            // Retrieve additional data from 'driverInfo' collection (if applicable)
                            if (requestData.userData.driver) {
                                const driverInfoRef = doc(firestoreDB, 'driverInfo', createdBy);
                                const driverInfoSnapshot = await getDoc(driverInfoRef);
                                requestData.driverInfo = driverInfoSnapshot.exists() ? driverInfoSnapshot.data() : {};
                            }

                            requestsData.push({
                                id: document?.id,
                                ...requestData,
                            });
                            console.log('inside', requestsData)
                        }

                    );
                    console.log('rrrr',requestsData)
                } else {
                    console.log('wrong data');
                }
            };
         
            // Sort and filter the requestsData
            console.log('rd11', requestsData)
            const filteredRequests = requestsData.filter(request => request.vehicleType == myReqData?.vehicleType);
            const sorted = filteredRequests.sort((a, b) => {
                if (a.seats === b.seats) {
                    return a.fare - b.fare; // Sort by fare in ascending order if seats are the same
                }
                return b.seats - a.seats; // Sort by seats in descending order
            });
            console.log('sorted',sorted)
            setFilteredRequests(sorted);
            setRequests(sorted);
            
            setIsLoading(false);

            // alert('loop done')
            // setFilteredRequests(requestsData);
            // setRequests(requestsData);
            // alert('jjj5')
            console.log('rd2', requestsData)


        };

        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, gender, ratingRange, fareRange, declinedRequests]);

    const applyFilters = () => {
        console.log('declinedReq', declinedRequests)

        console.log(filters.ac)
        console.log(filters.music)
        console.log(filters.coriders)

        const filtered = requests?.filter(request => {
            console.log('yaed', request?.userData?.rating)
            console.log('yaed', request?.fare)
            console.log('yaed', fareRange)
            console.log('fsd', request?.userData?.rating >= ratingRange[0] && request?.userData?.rating <= ratingRange[1])
            console.log('fsd', request?.fare >= fareRange[0] && request?.fare <= fareRange[1])
            return (
                (!filters.ac || request.ac) &&
                (!filters.music || request.music) &&
                (filters.coriders || request.coriders.length === 0) &&
                request?.userData?.rating >= ratingRange[0] && request?.userData?.rating <= ratingRange[1] &&
                request?.fare >= fareRange[0] && request?.fare <= fareRange[1] &&
                (gender == 'none' || (request?.userData?.gender === 1 && gender === 'female') || (request?.userData?.gender === 0 && gender === 'male')) &&
                !declinedRequests.includes(request?.id) &&
                request?.createdBy != currentUser._id &&
                request.status != 'closed'
            );
        }
        )
        setFilteredRequests(filtered);
    };


    const toggleFilter = (filter) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filter]: !prevFilters[filter]
        }));
    };

    useEffect(()=>{
        console.log('final req',filteredRequests)
    },[filteredRequests])

    const renderRequestItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.profileSection}>
                {item.userData?.profilePic ? (<Avatar rounded size="large" source={{ uri: item.userData?.profilePic }} />)
                    : (
                        <Avatar rounded size={90} source={require('../assets/avatar.jpg')}
                        />)}
                <View style={styles.hostDetails}>
                    <Text style={styles.textBold}>{item.driverInfo?.make} {item.driverInfo?.model}</Text>
                    <Text style={styles.text}>{item.userData.name}</Text>
                    <Text style={styles.textMini}>{item.userData.gender === 0 ? 'Male' : 'Female'}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="star" type="material" color={'gold'} size={15} />
                        <Text style={styles.textMed}>{item.userData.rating + ' (' + item.userData.ratingCount + ') '}  </Text>
                    </View>

                </View>

                <View style={{ paddingRight: 10 }}>
                    <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 22, textAlign: 'center' }]}>Rs.{item.fare}</Text>
                    <Text style={[styles.textBold, { color: GlobalColors.primary, fontSize: 14, textAlign: 'center', marginLeft: 'auto' }]}>Seats: {item.seats}</Text>

                    <TouchableOpacity style={{ backgroundColor: GlobalColors.primary, paddingVertical: 5, paddingHorizontal: 7, borderRadius: 7 }} onPress={() => { setCoridersVisible(true); setItem(item) }}>
                        <Text style={{ color: GlobalColors.background, textAlign: 'center' }}>
                            Coriders:  {item.coriders?.length}
                        </Text>
                    </TouchableOpacity>
                    <CoriderModal
                        visible={coridersVisible}
                        coriders={selectedItem?.coriders}
                        onClose={() => setCoridersVisible(false)}
                    />
                    <View style={styles.callChatIcons}>
                        <TouchableOpacity onPress={() => { navigation.navigate('ChatScreen', item.userData) }}>
                            <Icon name="comment-dots" type="font-awesome-5" size={30} color={GlobalColors.primary} />
                        </TouchableOpacity>
                        {item.userData.phoneNumber && <TouchableOpacity onPress={() => { Linking.openURL(`tel:${item.userData.phoneNumber}`) }}>
                            <Icon name="phone-alt" type="font-awesome-5" size={28} color={GlobalColors.primary} />
                        </TouchableOpacity>}
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Text style={[styles.textBold, { marginHorizontal: 10, color: item.userData.orgName == 'Unverified Institute' ? GlobalColors.error : GlobalColors.text }]}>{item.userData.orgName}</Text>
                <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginLeft: 'auto' }}>
                    <Text style={[styles.preferences, { textDecorationLine: item.music ? 'none' : 'line-through' }]}>Music</Text>
                    <Text style={[styles.preferences, { textDecorationLine: item.ac ? 'none' : 'line-through' }]}>AC</Text>
                </View>
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
                <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.accept }]} onPress={async () => await handleAcceptance(item.id)}>
                    <Text style={[styles.textBold, { color: GlobalColors.background }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: GlobalColors.error }]} onPress={() => {
                    setDeclinedRequests(prevState => [...prevState, item.id]); // Add declined request ID
                    console.log(item)
                    console.log(item.id)
                }}>
                    <Text style={[styles.textBold, { color: GlobalColors.background }]}>Decline</Text>
                </TouchableOpacity>

            </View>

        </View>
    );
    useEffect(() => {
        // Real-time listener for response status changes
        if (selectedRequestId) {
            const responseRef = doc(firestoreDB, 'responses', selectedRequestId);
            const unsubscribe = onSnapshot(responseRef, (doc) => {
                if (doc.exists()) {
                    const responseData = doc.data();

                    // Check if myReqData.id exists in responses
                    const myReqResponse = responseData.responses.find(response => response.responseBy === currentUser._id);

                    if (myReqResponse && myReqResponse.status === 'confirmed') {
                        setShowAcceptModal(false)
                        // Status changed to accepted, navigate to "during ride" screen
                        navigation.navigate('DuringRide', { requestId: selectedRequestId });
                    }
                    if (myReqResponse && myReqResponse.status === 'rejected') {
                        setShowAcceptModal(false)
                        Alert.alert(
                            'Request Rejected',
                            'Host has rejected your request. Find another one.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [selectedRequestId]);
    const handleAcceptance = async (reqID) => {
        setSelectedRequestId(reqID)

        // Add or update response in Firestore

        try {
            const responseRef = doc(firestoreDB, 'responses', reqID);
            const docSnapshot = await getDoc(responseRef);
            console.log('ok')
            console.log(response)
            console.log(myReqData)
            if (docSnapshot.exists()) {
                console.log(docSnapshot.data())
                const responseIndex = docSnapshot.data().responses.findIndex(response => response.responseBy === currentUser?._id);
                console.log(responseIndex)
                if (responseIndex == -1) {
                    // Document already exists, update it
                    await updateDoc(responseRef, {
                        responses: [...docSnapshot.data().responses, response]
                    });
                } else {
                    const existingData = docSnapshot.data()
                    existingData.responses[responseIndex] = response
                    console.log('d', existingData)
                    await updateDoc(responseRef,
                        { responses: existingData.responses }
                    );
                }
            } else {
                // Document doesn't exist, create it with the accepted request ID
                await setDoc(responseRef, {
                    responses: [response]
                });
            }
            console.log('Response added/updated successfully!');
            setShowAcceptModal(true)
        } catch (error) {
            console.error('Error adding/updating response:', error);
        }
    };

    const handleCancel = async () => {
        setShowAcceptModal(false)
        try {

            if (selectedRequestId) {
                const responseRef = doc(firestoreDB, 'responses', selectedRequestId);
                const responseData = await getDoc(responseRef);
                if (responseData.exists()) {
                    const responseIndex = responseData.data().responses.findIndex(response => response.responseBy === currentUser._id);
                    if (responseIndex !== -1) {
                        const updatedData = { ...responseData.data() };
                        updatedData.responses[responseIndex].status = 'cancelled';
                        await updateDoc(responseRef, updatedData);
                    } else {
                        console.error('Response not found for the current user.');
                    }
                }
                else { console.error('Response not found.') }
                console.log('Response canceled successfully!');
            }
            else { console.log('No selected Id') }
        } catch (error) {
            console.error('Error canceling response:', error);
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Available Hosts</Text>
            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
                    <Icon name="filter" type="font-awesome-5" color={GlobalColors.primary} size={20} />
                    <Text style={styles.textBold}> Filters</Text>
                </TouchableOpacity>

            </View>
            {/* {(isLoading && filteredRequests.length < 1) && (
                <ActivityIndicator size={"large"} color={GlobalColors.primary} />
            )} */}
            <FlatList
                data={filteredRequests}
                renderItem={renderRequestItem}
                key={item => item.id}
                ListFooterComponent={() => { return isLoading ? <ActivityIndicator size={"large"} color={GlobalColors.primary} /> : filteredRequests.length < 1 ? null : <Text style={{ color: 'black', textAlign: 'center' }}>No More Results!</Text> }}
                ListEmptyComponent={() => {
                    return isLoading ? null : <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}><Text style={{ color: 'black' }}>No Request found!</Text></View>
                }}
            />
            <Modal
                visible={showAcceptModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Waiting for confirmation...</Text>
                        <TouchableOpacity style={[styles.button, { flex: 0, backgroundColor: GlobalColors.error }]} onPress={async () => await handleCancel()}>
                            <Text style={[styles.textBold, { color: GlobalColors.background }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalContainer} onPress={() => setFilterModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContent} onPress={() => setFilterModalVisible(true)}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setFilterModalVisible(false)}>
                            <Icon name="times" type="font-awesome-5" color={GlobalColors.primary} size={20} />
                        </TouchableOpacity>
                        <Text style={styles.modalHeading}>Filters</Text>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>AC</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: GlobalColors.primary }}
                                thumbColor={filters.ac ? GlobalColors.background : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => toggleFilter('ac')}
                                value={filters.ac}
                                style={{ marginLeft: 'auto' }}
                            />
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Music</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: GlobalColors.primary }}
                                thumbColor={filters.music ? GlobalColors.background : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => toggleFilter('music')}
                                value={filters.music}
                                style={{ marginLeft: 'auto' }}
                            />
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Coriders</Text>
                            <Switch
                                trackColor={{ false: '#767577', true: GlobalColors.primary }}
                                thumbColor={filters.coriders ? GlobalColors.background : '#f4f3f4'}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={() => toggleFilter('coriders')}
                                value={filters.coriders}
                                style={{ marginLeft: 'auto' }}
                            />
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Rating</Text>
                            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                <Input
                                    style={styles.input}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const lower = Math.max(0, Math.min(parseFloat(value), parseFloat(ratingRange[1])));
                                            setRatingRange([lower, ratingRange[1] ?? 5]);
                                        } else {
                                            setRatingRange([1, ratingRange[1]]);
                                        }
                                    }}
                                    value={ratingRange[0] ? String(ratingRange[0]) : ''}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                                <Text style={{ fontSize: 45, marginLeft: 20 }}>-</Text>
                                <Input
                                    style={styles.input}
                                    placeholder="5"
                                    keyboardType="numeric"
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const upper = Math.min(5, Math.max(parseFloat(value), parseFloat(ratingRange[0])));
                                            setRatingRange([ratingRange[0] ?? 0, upper]);
                                        } else {
                                            setRatingRange([ratingRange[0], 5]);
                                        }
                                    }}
                                    value={ratingRange[1] ? String(ratingRange[1]) : ''}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                            </View>
                      
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Gender</Text>
                            <View style={{ marginLeft: 'auto' }}>
                                <Picker
                                    options={[
                                        { label: 'Select Gender', value: 'none', icon: 'venus-mars' },
                                        { label: 'Male', value: 'male', icon: 'mars' },
                                        { label: 'Female', value: 'female', icon: 'venus' },
                                    ]}
                                    selectedValue={gender}
                                    onValueChange={(value) => setGender(value)}
                                    placeholder="Select Gender"
                                    margin='40%'
                                />
                            </View>
                        </View>
                        <View style={styles.filterItem}>
                            <Text style={styles.filterText}>Fare</Text>
                            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                <Input
                                    style={styles.input}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={fareRange[0] ? String(fareRange[0]) : ''}
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const lower = Math.max(0, Math.min(parseFloat(value), parseFloat(fareRange[1])));
                                            setFareRange([lower, fareRange[1] ?? 10000]);
                                        } else {
                                            setFareRange([0, fareRange[1]]);
                                        }
                                    }}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                                <Text style={{ fontSize: 45, marginLeft: 20 }}>-</Text>
                                <Input
                                    style={styles.input}
                                    placeholder="10000"
                                    keyboardType="numeric"
                                    onChangeText={(value) => {
                                        if (value != '') {
                                            const upper = Math.min(5, Math.max(parseFloat(value), parseFloat(fareRange[0])));
                                            setRatingRange([fareRange[0] ?? 0, upper]);
                                        } else {
                                            setRatingRange([fareRange[0], 10000]);
                                        }
                                    }}
                                    value={fareRange[1] ? String(fareRange[1]) : ''}
                                    inputContainerStyle={{ borderBottomWidth: 0, width: 65 }}
                                    containerStyle={styles.inputContainer}
                                    suppressUndefinedOrNullWarning={true}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
});

export default FindHostScreen;
