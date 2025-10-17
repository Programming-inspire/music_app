import { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";

export default function App() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [duration, setDuration] = useState(0); // total duration in ms
  const [position, setPosition] = useState(0); // current position in ms

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

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    setSound(newSound);
    setIsPlaying(true);
  };

  // update playback progress
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
    }
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

  // handle user moving the slider
  const onSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  // clean up when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // helper to format time (mm:ss)
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 My Music App 🎵</Text>
      {fileName && <Text style={{ marginVertical: 10 }}>{fileName}</Text>}

      <View style={{ marginVertical: 10 }}>
        <Button title="Upload Music" onPress={pickAudio} />
      </View>

      {sound && (
        <View style={{ width: "80%", alignItems: "center" }}>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={onSeek}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#1DB954"
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
            <Text>{formatTime(position)}</Text>
            <Text>{formatTime(duration)}</Text>
          </View>

          <View style={{ marginTop: 20 }}>
            <Button title={isPlaying ? "Pause" : "Play"} onPress={togglePlayPause} />
          </View>

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
