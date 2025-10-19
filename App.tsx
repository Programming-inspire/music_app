import { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { BACKEND_URL } from "@env"; 

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [vocalsUrl, setVocalsUrl] = useState<string | null>(null);
  const [instUrl, setInstUrl] = useState<string | null>(null);
  const [vocalsSound, setVocalsSound] = useState<Audio.Sound | null>(null);
  const [instSound, setInstSound] = useState<Audio.Sound | null>(null);
  const [isPlayingVocals, setIsPlayingVocals] = useState(false);
  const [isPlayingInst, setIsPlayingInst] = useState(false);

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (result.assets && result.assets[0]) {
      const file = result.assets[0];
      await uploadToBackend(file.uri, file.name);
    }
  };

  const uploadToBackend = async (uri: string, filename: string) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: filename,
        type: "audio/mpeg",
      } as any);

      const res = await fetch(`${BACKEND_URL}/split`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log(data);
      setVocalsUrl(data.vocals_url);
      setInstUrl(data.instrumental_url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const playVocals = async () => {
    if (vocalsSound) {
      await vocalsSound.unloadAsync();
      setVocalsSound(null);
      setIsPlayingVocals(false);
    }
    if (vocalsUrl) {
      const { sound } = await Audio.Sound.createAsync({ uri: vocalsUrl }, { shouldPlay: true });
      setVocalsSound(sound);
      setIsPlayingVocals(true);
    }
  };

  const playInst = async () => {
    if (instSound) {
      await instSound.unloadAsync();
      setInstSound(null);
      setIsPlayingInst(false);
    }
    if (instUrl) {
      const { sound } = await Audio.Sound.createAsync({ uri: instUrl }, { shouldPlay: true });
      setInstSound(sound);
      setIsPlayingInst(true);
    }
  };

  useEffect(() => {
    return () => {
      if (vocalsSound) vocalsSound.unloadAsync();
      if (instSound) instSound.unloadAsync();
    };
  }, [vocalsSound, instSound]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Music Splitter 🎵</Text>
      <Button title="Choose Audio File" onPress={pickAudio} />

      {isLoading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {vocalsUrl && instUrl && (
        <View style={{ marginTop: 30 }}>
          <Text style={styles.subtitle}>Separated Tracks</Text>

          <View style={styles.track}>
            <Text>🎤 Vocals</Text>
            <Button title={isPlayingVocals ? "Stop" : "Play"} onPress={playVocals} />
          </View>

          <View style={styles.track}>
            <Text>🎸 Instrumental</Text>
            <Button title={isPlayingInst ? "Stop" : "Play"} onPress={playInst} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  track: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 200, marginVertical: 10 },
});
