import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useState } from 'react';
import RoomScreen from './screens/Room';
import HomeScreen from './screens/Home';
import { Audio, Video } from 'expo-av';

const App = () => {
  const [joinRoom, setJoinRoom] = useState(false);

  const onJoinRoomPress = async () => {
    try {
      await Audio.requestPermissionsAsync();
      // await Video.requestPermissionsAsync();
      setJoinRoom(true);
    } catch (error) {
      console.log('Permission not granted!', error);
    }
  };

  const handleRoomEnd = () => {
    setJoinRoom(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF7FF' }}>
      <StatusBar barStyle={'dark-content'} />

      {joinRoom ? (
        <RoomScreen handleRoomEnd={handleRoomEnd} />
      ) : (
        <HomeScreen handleJoinPress={onJoinRoomPress} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
