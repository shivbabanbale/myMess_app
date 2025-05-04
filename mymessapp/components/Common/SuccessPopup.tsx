import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants';

interface SuccessPopupProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ visible, message, onClose }) => {
  useEffect(() => {
    if (visible) {
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.popup}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={50} color={COLORS.primary} />
          </View>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface Styles {
  container: ViewStyle;
  popup: ViewStyle;
  iconContainer: ViewStyle;
  message: TextStyle;
  closeButton: ViewStyle;
  closeText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.medium,
  },
  popup: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: SIZES.medium,
  },
  message: {
    fontFamily: 'System',
    fontSize: FONTS.body2.fontSize,
    fontWeight: FONTS.body2.fontWeight as TextStyle['fontWeight'],
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SIZES.medium,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.small,
  },
  closeText: {
    fontFamily: 'System',
    fontSize: FONTS.body3.fontSize,
    fontWeight: FONTS.body3.fontWeight as TextStyle['fontWeight'],
    color: COLORS.white,
  },
});

export default SuccessPopup; 