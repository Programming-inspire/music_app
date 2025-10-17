import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";

export default function App() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // pick the audio file
  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });

    if (result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      const name = result.assets[0].name;
      setFileName(name);
      await loadAndPlaySound(uri);
    }
  };

  // load and play
  const loadAndPlaySound = async (uri: string) => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
    setIsPlaying(true);
  };

  // toggle play/pause
  const togglePlayPause = async () => {
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (status.isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 My Music App 🎵</Text>

      {fileName && <Text style={{ marginVertical: 10 }}>{fileName}</Text>}

      <View style={{ marginVertical: 20 }}>
        <Button title="Upload Music" onPress={pickAudio} />
      </View>

      {sound && (
        <View style={{ gap: 10 }}>
          <Button
            title={isPlaying ? "Pause" : "Play"}
            onPress={togglePlayPause}
          />
          <Text style={{ marginTop: 10 }}>
            {isPlaying ? "Now Playing..." : "Paused"}
          </Text>
        </View>
      )}
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
