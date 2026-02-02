import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AccountDeactivationModal = ({ visible, onClose, onLogout }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <SafeAreaView style={styles.container}>
                <View style={styles.modalContent}>
                    <Icon name="warning" size={60} color="#FF6B6B" />
                    <Text style={styles.title}>Account Deactivated</Text>
                    <Text style={styles.message}>
                        Your account has been deactivated. Please contact support.
                    </Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#FF6B6B',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
    },
});

export default AccountDeactivationModal;