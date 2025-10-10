import React, { useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { scanReceipt, ReceiptData } from '../OCR-reciept/scanner';

export default function ReceiptScannerTest() {
  const [result, setResult] = useState<ReceiptData | null>(null);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required!');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      try {
        const data = await scanReceipt(imageUri);
        setResult(data);
        Alert.alert('Scan Complete', 'Receipt scanned successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to scan receipt: ' + error.message);
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Pick Receipt Image and Scan" onPress={pickImage} />
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Scanned Data:</Text>
          <Text>Date: {result.date}</Text>
          <Text>Title: {result.title}</Text>
          {result.mobile && <Text>Mobile: {result.mobile}</Text>}
          <Text>Amount: {result.amount}</Text>
          <Text>Description: {result.description}</Text>
        </View>
      )}
    </View>
  );
}
