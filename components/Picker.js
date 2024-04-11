import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import GlobalColors from '../styles/globalColors';
import { Icon } from 'react-native-elements';

const Picker = ({ options, selectedValue, onValueChange, placeholder, margin }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const handlePress = () => {
        setModalVisible(true);
    };

    const handleItemPress = (itemValue) => {
        onValueChange(itemValue);
        setModalVisible(false);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleItemPress(item.value)}>
            <Icon name={item.icon} type='font-awesome-5' color={GlobalColors.primary} />
            <Text style={{ textAlign: 'center' }}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View >
            <TouchableOpacity onPress={handlePress} style={styles.input}>
                <Text>{selectedValue ? selectedValue : placeholder}</Text>
            </TouchableOpacity>
            <Modal visible={modalVisible} transparent animationType="slide" >
                <View style={styles.modalContainer}>
                    <FlatList
                        style={{flex:1 , marginVertical:  margin? margin :'7%'}}
                        containerStyle={{flex:1}}
                        contentContainerStyle={{ justifySelf: 'center', alignSelf: 'center', backgroundColor: GlobalColors.background, padding: 40 , borderWidth: 1, borderColor: GlobalColors.primary}}
                        data={options}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.value.toString()}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = {
    input: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: GlobalColors.primary,
        paddingHorizontal: 20,
        marginVertical: 7,
        width: 'auto',
        height: 40,
        justifyContent: 'center'
    },
    modalContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 'auto',
        justifySelf: 'center', alignSelf: 'center'
    },
    item: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderBottomWidth: 1,
        borderBottomColor: GlobalColors.secondary,
        color: GlobalColors.text,
    },
    closeButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: GlobalColors.primary,
        borderRadius: 15,
    },
};

export default Picker;
