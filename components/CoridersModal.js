import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { collection, doc, getDoc } from 'firebase/firestore';
import { firestoreDB } from '../config/firebase.config';
import { Avatar, Icon } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';

const CoriderModal = ({ visible, coriders, onClose }) => {
    const [riderDetails, setRiderDetails] = useState([]);

    useEffect(() => {
        const fetchRiderDetails = async () => {
            if (coriders) {
                const details = await Promise.all(coriders
                    ?.filter(corider => corider.status !== "cancelled")
                    ?.map(async (corider) => {
                        const userRef = doc(firestoreDB, 'users', corider.rider);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            console.log('ok')
                            return {
                                ...corider,
                                name: userData.name,
                                profilePic: userData.profilePic,
                                rating: userData.rating,
                                ratingCount: userData.ratingCount
                            };
                        } else {
                            return {
                                ...corider,
                                name: 'Unknown',
                                profilePic: null,
                                rating: 0,
                                ratingCount: 0
                            };
                        }

                    }
                    )
                )
           

            coriders?setRiderDetails(details): setRiderDetails([]);
            console.log(riderDetails)
        }
        };

        fetchRiderDetails();
    }, [coriders]);

    const renderCoriderItem = ({ item }) => (
        <View style={styles.coriderItem}>
            <View style={styles.coriderDetails}>
                {item?.profilePic ? (<Avatar rounded size={60} source={{ uri: item.profilePic }} />)
                    : (
                        <Avatar rounded size={60} source={require('../assets/avatar.jpg')}
                        />)}
                <View>
                    <Text style={styles.coriderName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Icon name="star" type="material" color={'gold'} size={15} />
                        <Text style={styles.textMed}>{item.rating + ' (' + item.ratingCount + ') '}  </Text>
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                <Text> From: {item.from} </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Icon name="map-marker-alt" type="font-awesome-5" color={GlobalColors.primary} size={15} />
                <Text> To: {item.to} </Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon type='font-awesome-5' name='times' color={GlobalColors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Coriders</Text>
                    <FlatList
                        data={riderDetails}
                        renderItem={renderCoriderItem}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        width: '85%',
    },
    closeButton: {
        alignSelf: 'flex-start',
    },
    closeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'red',
    },
    heading: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: GlobalColors.primary
    },
    coriderItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 10,
    },
    coriderDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    coriderName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CoriderModal;
