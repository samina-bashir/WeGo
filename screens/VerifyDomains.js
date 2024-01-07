import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { firestoreDB } from '../config/firebase.config';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { Icon, SearchBar } from 'react-native-elements';
import GlobalColors from '../styles/globalColors';

const VerifyDomains = () => {
    const [sortedDomains, setSortedDomains] = useState([]);
    const [orgNames, setOrgNames] = useState({});
    const [editingDomain, setEditingDomain] = useState(null);
    const [rejectedDomains, setRejectedDomains] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredNonRejectedDomains, setFilteredNonRejectedDomains] = useState([]);
    const [filteredRejectedDomains, setFilteredRejectedDomains] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user data
                const usersSnapshot = await getDocs(collection(firestoreDB, 'users'));

                // Extract unique domains from user emails
                const uniqueDomains = Array.from(
                    new Set(usersSnapshot.docs.map((doc) => doc.data().email.split('@')[1]))
                );

                // Create initial domain-organization mapping data
                const domainMappingData = uniqueDomains.reduce((acc, domain) => {
                    acc[domain] = { Name: '', rejected: false }; // Initialize org names and rejected status
                    return acc;
                }, {});

                // Fetch the domain-organization mapping data
                const domainMappingSnapshot = await getDocs(collection(firestoreDB, 'organizations'));

                domainMappingSnapshot.forEach((doc) => {
                    domainMappingData[doc.id] = {
                        Name: doc.data()?.Name || '',
                        rejected: doc.data().rejected || false,
                    };
                });

                // Separate rejected and non-rejected domains
                const nonRejectedDomains = Object.keys(domainMappingData).filter(
                    (domain) => !domainMappingData[domain].rejected
                );

                // Sort the non-rejected domains based on whether they have org names or not
                const sortedNonRejectedDomains = nonRejectedDomains.sort((a, b) => {
                    if (domainMappingData[a] && !domainMappingData[b]) return 1;
                    if (!domainMappingData[a] && domainMappingData[b]) return -1;
                    return 0;
                });

                setSortedDomains(sortedNonRejectedDomains);
                setOrgNames(domainMappingData);
                const rejectedDomains=Object.keys(domainMappingData).filter((domain) => domainMappingData[domain].rejected);
                setRejectedDomains(rejectedDomains);
                setFilteredNonRejectedDomains(sortedNonRejectedDomains);
                setFilteredRejectedDomains(rejectedDomains);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchData();
    }, []);

    const renderDomainItem = ({ item, rejected }) => {
        return (
            <View style={styles.domainItemContainer}>
                <Text style={styles.domainText}>{item}</Text>
                {editingDomain === item ? (
                    <TextInput
                        style={styles.orgInput}
                        placeholder=""
                        value={orgNames[item]?.Name}
                        onChangeText={(text) => handleOrgNameChange(item, text)}
                    />
                ) : (
                    <Text style={styles.Name}>{orgNames[item]?.Name}</Text>
                )}
                {!rejected && <TouchableOpacity style={styles.iconButton} onPress={() => handleToggleEdit(item)}>
                    <Icon
                        type='font-awesome-5'
                        name={editingDomain === item ? 'check' : 'edit'}
                        color={GlobalColors.primary}
                    />
                </TouchableOpacity>}
                <TouchableOpacity style={styles.iconButton} onPress={() => (rejected ? handleCancelRejectDomain(item) : handleRejectDomain(item))}>
                    <Icon type='font-awesome-5' name={rejected ? 'minus-circle' : 'ban'} color={GlobalColors.error} />
                </TouchableOpacity>
            </View>
        );
    };

    const handleToggleEdit = (domain) => {
        editingDomain==domain && handleOrgNameUpdate(domain)
        setEditingDomain((prevEditingDomain) =>
            prevEditingDomain === domain ? null : domain
        );
    };

    const handleOrgNameChange = (domain, Name) => {
        setOrgNames((prevOrgNames) => ({ ...prevOrgNames, [domain]: {Name,rejected:false} }));
    };

    const handleOrgNameUpdate = async (domain) => {
        try {
            // Update the org name in the database
            const docRef = doc(firestoreDB, 'organizations', domain);
            await setDoc(docRef, { Name: orgNames[domain]?.Name || '', rejected:false});
        } catch (error) {
            console.error('Error updating org name:', error);
        }
    };

    const handleRejectDomain = async (domain) => {
        try {
            // Set the domain as rejected in the state
            setFilteredNonRejectedDomains((prevDomains) => prevDomains.filter((item) => item !== domain));
            setFilteredRejectedDomains((prevRejected) => [...prevRejected, domain]);

            // Set the domain as rejected in the database
            const docRef = doc(firestoreDB, 'organizations', domain);
            await setDoc(docRef, { Name: '',rejected: true });
        } catch (error) {
            console.error('Error rejecting domain:', error);
        }
    };

    const handleCancelRejectDomain = async (domain) => {
        try {
            // Remove the domain from rejected state
            setFilteredRejectedDomains((prevRejected) => prevRejected.filter((item) => item !== domain));
            setFilteredNonRejectedDomains((prevDomains) => [...prevDomains, domain]);
            // Cancel rejection in the database
            const docRef = doc(firestoreDB, 'organizations', domain);
            await setDoc(docRef, { Name:'',rejected: false });
        } catch (error) {
            console.error('Error cancelling rejection:', error);
        }
    };
    const searchDomains = (text) => {
        setSearchQuery(text);

        // Filter and set sorted domains based on search query
        const filteredNonRejected = sortedDomains.filter((domain) =>
            domain.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredNonRejectedDomains(filteredNonRejected);

        // Filter and set rejected domains based on search query
        const filteredRejected = rejectedDomains.filter((domain) =>
            domain.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredRejectedDomains(filteredRejected);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Organizations</Text>
            <SearchBar
                placeholder="Search Domains"
                onChangeText={(text) => searchDomains(text)}
                value={searchQuery}
                containerStyle={styles.searchContainer}
                inputContainerStyle={styles.searchInputContainer}
            />
            {filteredNonRejectedDomains.length > 0 && (<FlatList data={filteredNonRejectedDomains} keyExtractor={(item) => item} renderItem={({ item }) => renderDomainItem({ item, rejected: false })} />)}

            {filteredRejectedDomains.length > 0 && (
                <>
                    <Text style={styles.title}>Rejected Domains</Text>
                    <FlatList
                        data={filteredRejectedDomains}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => renderDomainItem({ item, rejected: true })}
                    />
                </>
            )}
            {(sortedDomains.length != 0 && rejectedDomains.length != 0 && filteredNonRejectedDomains.length == 0 && filteredRejectedDomains.length==0) && (
                <Text style={styles.noItemsMessage}>No domains found</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor:GlobalColors.background
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 30,
        color: GlobalColors.primary,
        marginVertical: '7%',
    },
    title: {
        fontSize: 20,
        color: GlobalColors.error,
    },
    domainItemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray',
        alignItems: 'center',
    },
    domainText: {
        fontSize: 16,
        flex: 1.5,
    },
    orgInput: {
        flex: 1.5,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        paddingHorizontal: 8,
        marginRight: 8,
    },
    Name: {
        flex: 1.5,
        fontSize: 16,
    },
    iconButton: {
        padding: 3,
        borderRadius: 5,
        paddingHorizontal: 9,
    },
    searchContainer: {
        borderTopColor: GlobalColors.background,
        borderBottomColor: GlobalColors.background,
        padding: 0,
        backgroundColor:GlobalColors.background
    },
    searchInputContainer: {
        borderColor: GlobalColors.primary,
        borderBottomColor: GlobalColors.primary,
        borderWidth: 2,
        borderRadius: 10,
        paddingHorizontal: 10,
        color: GlobalColors.primary,
        borderBottomWidth: 2,
        backgroundColor:GlobalColors.background
    },
    noItemsMessage: {
        fontSize: 20,
        textAlign: 'center',
        color: GlobalColors.primary,
        marginTop: 20,
    },
});

export default VerifyDomains;
