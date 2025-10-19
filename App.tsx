import { useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import Slider from "@react-native-community/slider";
import { BACKEND_URL } from "@env";

type Stem = { name: string; url: string | null };

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [stems, setStems] = useState<Stem[]>([
    { name: "vocals", url: null },
    { name: "drums", url: null },
    { name: "bass", url: null },
    { name: "other", url: null },
  ]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(null);

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (result.assets && result.assets[0]) {
      const file = result.assets[0];
      await uploadToBackend(file.uri, file.name);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const uploadToBackend = async (uri: string, filename: string) => {
    try {
      setIsLoading(true);
      setActivePlayerIndex(null);

      const formData = new FormData();
      formData.append("file", { uri, name: filename, type: "audio/mpeg" } as any);

      const res = await fetch(`${BACKEND_URL}/split`, { method: "POST", body: formData });
      const data = await res.json();

      setStems((prev) =>
        prev.map((stem) => ({
          ...stem,
          url: data[`${stem.name}_url`] ? decodeURIComponent(data[`${stem.name}_url`]) : null,
        }))
      );
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Stem Player Component ----------
  const StemPlayer = ({ stem, index }: { stem: Stem; index: number }) => {
    const player = useAudioPlayer(stem.url);
    const status = useAudioPlayerStatus(player);

    const togglePlay = () => {
      if (!stem.url) return;

      if (status.playing) {
        player.pause();
      } else {
        // Pause previous active player
        if (activePlayerIndex !== null && activePlayerIndex !== index) {
          // We need to stop previous player
          // Note: This assumes we maintain a ref or a single source for previous players if needed
        }
        setActivePlayerIndex(index);
        player.play();
      }
    };

    return (
      <View style={styles.trackContainer}>
        <Text>{stem.name.toUpperCase()}</Text>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={status.duration || 1}
          value={status.currentTime || 0}
          onSlidingComplete={(value) => player.seekTo(value)}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#1DB954"
        />

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(status.currentTime || 0)}</Text>
          <Text style={styles.timeText}>{formatTime(status.duration || 1)}</Text>
        </View>

        <TouchableOpacity style={styles.circleButton} onPress={togglePlay}>
          <Text style={{ color: "#fff", fontSize: 20 }}>
            {status.playing ? "⏸" : "▶️"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Music Splitter 🎵</Text>
      <Button title="Choose Audio File" onPress={pickAudio} />
      {isLoading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {stems.every((s) => s.url) && (
        <View style={{ marginTop: 30, width: "100%" }}>
          <Text style={styles.subtitle}>Separated Tracks</Text>
          {stems.map((stem, i) => (
            <StemPlayer key={stem.name} stem={stem} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  trackContainer: { marginVertical: 15, width: "100%", alignItems: "center" },
  slider: { width: "90%", height: 40 },
  circleButton: { marginTop: 10, width: 50, height: 50, borderRadius: 25, backgroundColor: "#1DB954", alignItems: "center", justifyContent: "center" },
  timeRow: { flexDirection: "row", justifyContent: "space-between", width: "90%", marginTop: -10, marginBottom: 10 },
  timeText: { fontSize: 12, color: "#666" },
});
