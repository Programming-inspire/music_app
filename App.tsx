import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";

export default function App() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // pick the music file
  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
    });

    if (result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      const name = result.assets[0].name;
      setFileName(name);
      playSound(uri);
    }
  };

  // play the audio file
  const playSound = async (uri: string) => {
    // if already playing something, unload first
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>🎵 My Music App 🎵</Text>
      {fileName && <Text style={{ marginVertical: 10 }}>{fileName}</Text>}
      <Button title="Upload & Play Music" onPress={pickAudio} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
