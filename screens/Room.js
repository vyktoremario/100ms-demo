import { FlatList, Text, View, TouchableHighlight, ActivityIndicator } from 'react-native';
import { usePeerTrackNodes } from '../hooks/usePeerTrackNodes';

const RoomScreen = ({ handleRoomEnd }) => {
  const {
    peerTrackNodes,
    loading,
    leaveRoom,
    hmsInstanceRef,
    onHandleAudioMute,
    onHandleVideoMute,
  } = usePeerTrackNodes({ handleRoomEnd });

  const HmsView = hmsInstanceRef.current?.HmsView;

  const _keyExtractor = (item) => item.id;

  const _renderItem = ({ item }) => {
    const { peer, track } = item;

    return (
      <View
        style={{
          height: 300,
          margin: 8,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: '#A0C3D2',
        }}
      >
        {/* Checking if we have "HmsView" component, valid trackId and "track is not muted" */}
        {HmsView && track && track.trackId && !track.isMute() ? (
          // To Render Peer Live Videos, We can use HMSView
          // For more info about its props and usage, Check out {@link https://www.100ms.live/docs/react-native/v2/features/render-video | Render Video}
          <HmsView
            trackId={track.trackId}
            mirror={peer.isLocal}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FD8A8A',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {peer.name
                  .split(' ')
                  .map((item) => item[0])
                  .join('')}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const onHandleRoomEnd = () => {
    leaveRoom();
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        // Showing loader while Join is under process
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size={'large'} color="#2471ED" />
        </View>
      ) : (
        <View style={{ flex: 1, position: 'relative' }}>
          {peerTrackNodes.length > 0 ? (
            // Rendering list of Peers
            <FlatList
              centerContent={true}
              data={peerTrackNodes}
              showsVerticalScrollIndicator={false}
              keyExtractor={_keyExtractor}
              renderItem={_renderItem}
              contentContainerStyle={{
                paddingBottom: 120,
                flexGrow: Platform.OS === 'android' ? 1 : undefined,
                justifyContent: Platform.OS === 'android' ? 'center' : undefined,
              }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28, marginBottom: 32 }}>Welcome!</Text>
              <Text style={{ fontSize: 16 }}>You’re the first one here.</Text>
              <Text style={{ fontSize: 16 }}>Sit back and relax till the others join.</Text>
            </View>
          )}

          {/* Button to Leave Room */}
          <TouchableHighlight
            onPress={onHandleRoomEnd}
            underlayColor="#6e2028"
            style={{
              position: 'absolute',
              bottom: 40,
              alignSelf: 'center',
              backgroundColor: '#CC525F',
              width: 60,
              height: 60,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ textAlign: 'center', color: '#ffffff', fontWeight: 'bold' }}>
              Leave Room
            </Text>
          </TouchableHighlight>
        </View>
      )}
    </View>
  );
};

export default RoomScreen;
