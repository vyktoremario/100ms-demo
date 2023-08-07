import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
  } from "react-native";
  import React, { useEffect, useState, useRef } from "react";
  import {
    HMSSDK,
    HMSUpdateListenerActions,
    HMSConfig,
    HMSTrackType,
    HMSTrackUpdate,
    HMSPeerUpdate,
    HMSAudioTrackSettings,
    HMSVideoTrackSettings,
    HMSTrackSettings,
    HMSTrackSettingsInitState,
    HMSCameraFacing,
  } from "@100mslive/react-native-hms";

  import { MODERATOR_AUTH_TOKEN, MODERATOR_ROOM_CODE } from "../utils/constants";
  
  const ROOM_CODE = MODERATOR_ROOM_CODE;
  const AUTH_TOKEN = MODERATOR_AUTH_TOKEN;

  
  const RoomScreen = ({ handleRoomEnd }) => {
    const [peerTrackNodes, setPeerTrackNodes] = useState([]);
    const [loading, setLoading] = useState(true);
  
    const hmsInstanceRef = useRef(null);
    // Joining a room
    const onJoinSuccess = (data) => {
      const { localPeer } = data.room;
      setPeerTrackNodes([{ peer: localPeer, track: localPeer.videoTrack }]);
  
      setLoading(false);
    };
  
    //Listening for peers actions in a room
    const onPeerListener = ({ peer, type }) => {
      if (type === HMSPeerUpdate.PEER_LEFT) {
        setPeerTrackNodes((prevNodes) =>
          prevNodes.filter((node) => node.peer.peerID !== peer.peerID)
        );
      } else if (type !== HMSPeerUpdate.PEER_JOINED) {
        setPeerTrackNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.peer.peerID === peer.peerID ? { ...node, peer } : node
          )
        );
      }
    };
  
    // Listen for audo, video track controls in a room by a peer
    const onTrackListener = ({ peer, track, type }) => {
      if (
        type === HMSTrackUpdate.TRACK_ADDED &&
        track.type === HMSTrackType.VIDEO
      ) {
        setPeerTrackNodes((prevNodes) => [...prevNodes, { peer, track }]);
      } else if (
        type === HMSTrackUpdate.TRACK_MUTED ||
        type === HMSTrackUpdate.TRACK_UNMUTED
      ) {
        setPeerTrackNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (
              node.peer.peerID === peer.peerID &&
              node.track &&
              node.track.trackId === track.trackId
            ) {
              return { ...node, track };
            }
            return node;
          })
        );
      }
    };
  
    // Listen for error
    const onErrorListener = (error) => {
      setLoading(false);
      console.log(error?.description);
    };

    const getTrackSettings = ({
        mutedAudio,
        mutedVideo,
      }) => {
        let audioSettings = new HMSAudioTrackSettings({
          initialState: mutedAudio
            ? HMSTrackSettingsInitState.MUTED
            : HMSTrackSettingsInitState.UNMUTED,
        });
      
        let videoSettings = new HMSVideoTrackSettings({
          initialState: mutedVideo
            ? HMSTrackSettingsInitState.MUTED
            : HMSTrackSettingsInitState.UNMUTED,
          cameraFacing: HMSCameraFacing.FRONT,
          forceSoftwareDecoder: true,
        });
      
        return new HMSTrackSettings({
          video: videoSettings,
          audio: audioSettings,
        });
      };
  
    
    useEffect(() => {
      const joinRoom = async () => {
        try {
          setLoading(true);

          const trackSettings = getTrackSettings({
            mutedAudio: true,
            mutedVideo: true,
          });

          const hmsInstance = await HMSSDK.build({trackSettings});
          if (hmsInstance) {
            console.log("hmsInstance built");
          }
          hmsInstanceRef.current = hmsInstance;

          const token =
            AUTH_TOKEN || (await hmsInstance.getAuthTokenByRoomCode(ROOM_CODE));
  
          const config = new HMSConfig({ authToken: token, username: USERNAME });
          await hmsInstance.join(config);
  
          
          hmsInstance.addEventListener(
            HMSUpdateListenerActions.ON_JOIN,
            onJoinSuccess
          );
          hmsInstance.addEventListener(
            HMSUpdateListenerActions.ON_PEER_UPDATE,
            onPeerListener
          );
          hmsInstance.addEventListener(
            HMSUpdateListenerActions.ON_TRACK_UPDATE,
            onTrackListener
          );
          hmsInstance.addEventListener(
            HMSUpdateListenerActions.ON_ERROR,
            onErrorListener
          );
        } catch (error) {
          console.error(error);
          Alert.alert("Error", "Check your console to see error logs!");
        }
      };
  
      joinRoom();
  
      return () => {
        handleRoomEnd();
      };
    }, [handleRoomEnd]);
  
    const renderItem = ({ item }) => {
      const { peer, track } = item;
  
      return (
        <View
          style={{
            height: 300,
            margin: 8,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#A0C3D2",
          }}
        >
          {track && track.type === HMSTrackType.VIDEO ? (
            <HMSSDK.HmsView
              trackId={track.trackId}
              mirror={peer.isLocal}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FD8A8A",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 28,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {peer.name
                    .split(" ")
                    .map((item) => item[0])
                    .join("")}
                </Text>
              </View>
            </View>
          )}
        </View>
      );
    };
  
    return (
      <View style={{ flex: 1 }}>
        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color="#2471ED" />
          </View>
        ) : peerTrackNodes.length > 0 ? (
          <FlatList
            data={peerTrackNodes}
            renderItem={renderItem}
            keyExtractor={(item) => item.peer.peerID}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 28, marginBottom: 32 }}>Welcome!</Text>
            <Text style={{ fontSize: 16 }}>You're the first one here.</Text>
            <Text style={{ fontSize: 16 }}>
              Sit back and relax till the others join.
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleRoomEnd}
          style={{
            position: "absolute",
            bottom: 40,
            alignSelf: "center",
            backgroundColor: "#CC525F",
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{ textAlign: "center", color: "#ffffff", fontWeight: "bold" }}
          >
            Leave Room
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  export default RoomScreen;
  
  // import {
  //   View,
  //   Text,
  //   ActivityIndicator,
  //   FlatList,
  //   TouchableHighlight,
  //   Alert,
  // } from "react-native";
  // import React, { useEffect, useRef, useState } from "react";
  // import { PERMISSIONS, request, requestMultiple, RESULTS } from 'react-native-permissions';
  // import {
  //   HMSSDK,
  //   HMSUpdateListenerActions,
  //   HMSConfig,
  //   HMSTrackType,
  //   HMSTrackUpdate,
  //   HMSPeerUpdate,
  // } from "@100mslive/react-native-hms";
  // import { MODERATOR_AUTH_TOKEN } from "../utils/constants";
  
  // const ROOM_CODE = "yqa-fqee-nda";
  // const AUTH_TOKEN = MODERATOR_AUTH_TOKEN;
  // const USERNAME = "Test User";
  
  // const RoomScreen = ({ navigate }) => {
  //   const { peerTrackNodes, loading, leaveRoom, hmsInstanceRef } =
  //     usePeerTrackNodes({ navigate });
  
  //   const HmsView = hmsInstanceRef.current?.HmsView;
  
  //   const _keyExtractor = (item) => item.id;
  
  //   // `_renderItem` function returns a Tile UI for each item which is `PeerTrackNode` object
  //   const _renderItem = ({ item }) => {
  //     const { peer, track } = item;
  
  //     return (
  //       <View
  //         style={{
  //           height: 300,
  //           margin: 8,
  //           borderRadius: 20,
  //           overflow: "hidden",
  //           backgroundColor: "#A0C3D2",
  //         }}
  //       >
  //         {/* Checking if we have "HmsView" component, valid trackId and "track is not muted" */}
  //         {HmsView && track && track.trackId && !track.isMute() ? (
  //           <HmsView
  //             trackId={track.trackId}
  //             mirror={peer.isLocal}
  //             style={{ width: "100%", height: "100%" }}
  //           />
  //         ) : (
  //           <View
  //             style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
  //           >
  //             <View
  //               style={{
  //                 width: 100,
  //                 height: 100,
  //                 borderRadius: 50,
  //                 alignItems: "center",
  //                 justifyContent: "center",
  //                 backgroundColor: "#FD8A8A",
  //               }}
  //             >
  //               <Text
  //                 style={{
  //                   textAlign: "center",
  //                   fontSize: 28,
  //                   fontWeight: "bold",
  //                   textTransform: "uppercase",
  //                 }}
  //               >
  //                 {peer.name
  //                   .split(" ")
  //                   .map((item) => item[0])
  //                   .join("")}
  //               </Text>
  //             </View>
  //           </View>
  //         )}
  //       </View>
  //     );
  //   };
  
  //   const handleRoomEnd = () => {
  //     leaveRoom();
  
  //     navigate("HomeScreen");
  //   };
  
  //   return (
  //     <View style={{ flex: 1 }}>
  //       {loading ? (
  //         // Showing loader while Join is under process
  //         <View
  //           style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
  //         >
  //           <ActivityIndicator size={"large"} color="#2471ED" />
  //         </View>
  //       ) : (
  //         <View style={{ flex: 1, position: "relative" }}>
  //           {peerTrackNodes.length > 0 ? (
  //             // Rendering list of Peers
  //             <FlatList
  //               centerContent={true}
  //               data={peerTrackNodes}
  //               showsVerticalScrollIndicator={false}
  //               keyExtractor={_keyExtractor}
  //               renderItem={_renderItem}
  //               contentContainerStyle={{
  //                 paddingBottom: 120,
  //                 flexGrow: Platform.OS === "android" ? 1 : undefined,
  //                 justifyContent:
  //                   Platform.OS === "android" ? "center" : undefined,
  //               }}
  //             />
  //           ) : (
  //             <View
  //               style={{
  //                 flex: 1,
  //                 alignItems: "center",
  //                 justifyContent: "center",
  //               }}
  //             >
  //               <Text style={{ fontSize: 28, marginBottom: 32 }}>Welcome!</Text>
  //               <Text style={{ fontSize: 16 }}>You’re the first one here.</Text>
  //               <Text style={{ fontSize: 16 }}>
  //                 Sit back and relax till the others join.
  //               </Text>
  //             </View>
  //           )}
  
  //           {/* Button to Leave Room */}
  //           <TouchableHighlight
  //             onPress={handleRoomEnd}
  //             underlayColor="#6e2028"
  //             style={{
  //               position: "absolute",
  //               bottom: 40,
  //               alignSelf: "center",
  //               backgroundColor: "#CC525F",
  //               width: 60,
  //               height: 60,
  //               borderRadius: 30,
  //               alignItems: "center",
  //               justifyContent: "center",
  //             }}
  //           >
  //             <Text
  //               style={{
  //                 textAlign: "center",
  //                 color: "#ffffff",
  //                 fontWeight: "bold",
  //               }}
  //             >
  //               Leave Room
  //             </Text>
  //           </TouchableHighlight>
  //         </View>
  //       )}
  //     </View>
  //   );
  // };
  
  // export default RoomScreen;
  
  // export const usePeerTrackNodes = ({ navigate }) => {
  //   const hmsInstanceRef = useRef(null);
  //   const [loading, setLoading] = useState(true);
  //   const [peerTrackNodes, setPeerTrackNodes] = useState([]);
  
  //   const handleRoomLeave = async () => {
  //     try {
  //       const hmsInstance = hmsInstanceRef.current;
  
  //       if (!hmsInstance) {
  //         return Promise.reject("HMSSDK instance is null");
  //       }
  //       // Removing all registered listeners
  //       hmsInstance.removeAllListeners();
  
  //       const leaveResult = await hmsInstance.leave();
  //       console.log("Leave Success: ", leaveResult);
  
  //       const destroyResult = await hmsInstance.destroy();
  //       console.log("Destroy Success: ", destroyResult);
  
  //       // Removing HMSSDK instance
  //       hmsInstanceRef.current = null;
  //     } catch (error) {
  //       console.log("Leave or Destroy Error: ", error);
  //     }
  //   };
  
  //   const onJoinSuccess = (data) => {
  //     const { localPeer } = data.room;
  
  //     // Creating or Updating Local Peer Tile
  
  //     // `updateNode` function updates "Track and Peer objects" in PeerTrackNodes and returns updated list.
  //     // if none exist then we are "creating a new PeerTrackNode with the received Track and Peer"
  //     setPeerTrackNodes((prevPeerTrackNodes) =>
  //       updateNode({
  //         nodes: prevPeerTrackNodes,
  //         peer: localPeer,
  //         track: localPeer.videoTrack,
  //         createNew: true,
  //       })
  //     );
  
  //     // Turning off loading state on successful Room Room join
  //     setLoading(false);
  //   };
  
  //   const onPeerListener = ({ peer, type }) => {
  //     // We will create Tile for the Joined Peer when we receive `HMSUpdateListenerActions.ON_TRACK_UPDATE` event.
  //     // Note: We are chosing to not create Tiles for Peers which does not have any tracks
  //     if (type === HMSPeerUpdate.PEER_JOINED) return;
  
  //     if (type === HMSPeerUpdate.PEER_LEFT) {
  //       // Remove all Tiles which has peer same as the peer which just left the room.
  //       // `removeNodeWithPeerId` function removes peerTrackNodes which has given peerID and returns updated list.
  //       setPeerTrackNodes((prevPeerTrackNodes) =>
  //         removeNodeWithPeerId(prevPeerTrackNodes, peer.peerID)
  //       );
  //       return;
  //     }
  
  //     if (peer.isLocal) {
  //       // Updating the LocalPeer Tile.
  //       // `updateNodeWithPeer` function updates Peer object in PeerTrackNodes and returns updated list.
  //       // if none exist then we are "creating a new PeerTrackNode for the updated Peer".
  //       setPeerTrackNodes((prevPeerTrackNodes) =>
  //         updateNodeWithPeer({ nodes: prevPeerTrackNodes, peer, createNew: true })
  //       );
  //       return;
  //     }
  
  //     if (
  //       type === HMSPeerUpdate.ROLE_CHANGED ||
  //       type === HMSPeerUpdate.METADATA_CHANGED ||
  //       type === HMSPeerUpdate.NAME_CHANGED ||
  //       type === HMSPeerUpdate.NETWORK_QUALITY_UPDATED
  //     ) {
  //       // Ignoring these update types because we want to keep this implementation simple.
  //       return;
  //     }
  //   };
  
  //   const onTrackListener = ({ peer, track, type }) => {
  //     // on TRACK_ADDED update
  //     // We will update Tile with the track or
  //     // create new Tile for with the track and peer
  //     if (
  //       type === HMSTrackUpdate.TRACK_ADDED &&
  //       track.type === HMSTrackType.VIDEO
  //     ) {
  //       // We will only update or create Tile "with updated track" when track type is Video.
  //       // Tiles without Video Track are already respresenting Peers with or without Audio.
  
  //       // Updating the Tiles with Track and Peer.
  //       // `updateNode` function updates "Track and Peer objects" in PeerTrackNodes and returns updated list.
  //       // if none exist then we are "creating a new PeerTrackNode with the received Track and Peer".
  //       setPeerTrackNodes((prevPeerTrackNodes) =>
  //         updateNode({
  //           nodes: prevPeerTrackNodes,
  //           peer,
  //           track,
  //           createNew: true,
  //         })
  //       );
  
  //       return;
  //     }
  
  //     // on TRACK_MUTED or TRACK_UNMUTED updates, We will update Tiles (PeerTrackNodes)
  //     if (
  //       type === HMSTrackUpdate.TRACK_MUTED ||
  //       type === HMSTrackUpdate.TRACK_UNMUTED
  //     ) {
  //       // We will only update Tile "with updated track" when track type is Video.
  //       if (track.type === HMSTrackType.VIDEO) {
  //         // Updating the Tiles with Track and Peer.
  //         // `updateNode` function updates "Track and Peer objects" in PeerTrackNodes and returns updated list.
  //         // Note: We are not creating new PeerTrackNode object.
  //         setPeerTrackNodes((prevPeerTrackNodes) =>
  //           updateNode({
  //             nodes: prevPeerTrackNodes,
  //             peer,
  //             track,
  //           })
  //         );
  //       } else {
  //         // Updating the Tiles with Peer.
  //         // `updateNodeWithPeer` function updates Peer object in PeerTrackNodes and returns updated list.
  //         // Note: We are not creating new PeerTrackNode object.
  //         setPeerTrackNodes((prevPeerTrackNodes) =>
  //           updateNodeWithPeer({
  //             nodes: prevPeerTrackNodes,
  //             peer,
  //           })
  //         );
  //       }
  //       return;
  //     }
  
  //     if (type === HMSTrackUpdate.TRACK_REMOVED) {
  //       // If non-regular track, or
  //       // both regular video and audio tracks are removed
  //       // Then we will remove Tiles (PeerTrackNodes) with removed track and received peer
  //       return;
  //     }
  
  //     if (
  //       type === HMSTrackUpdate.TRACK_RESTORED ||
  //       type === HMSTrackUpdate.TRACK_DEGRADED
  //     ) {
  //       return;
  //     }
  //   };
  
  //   const onErrorListener = (error) => {
  //     setLoading(false);
  
  //     console.log(`${error?.code} ${error?.description}`);
  //   };
  
  //   useEffect(() => {
  //     const joinRoom = async () => {
  //       try {
  //         setLoading(true);
  //         const hmsInstance = await HMSSDK.build();
  
  //         // Saving `hmsInstance` in ref
  //         hmsInstanceRef.current = hmsInstance;
  
  //         let token = AUTH_TOKEN;
  
  //         // if `AUTH_TOKEN` is not valid, generate auth token from `ROOM_CODE`
  //         if (!token) {
  //           token = await hmsInstance.getAuthTokenByRoomCode(ROOM_CODE);
  //         }
  
  //         hmsInstance.addEventListener(
  //           HMSUpdateListenerActions.ON_JOIN,
  //           onJoinSuccess
  //         );
  
  //         hmsInstance.addEventListener(
  //           HMSUpdateListenerActions.ON_PEER_UPDATE,
  //           onPeerListener
  //         );
  
  //         hmsInstance.addEventListener(
  //           HMSUpdateListenerActions.ON_TRACK_UPDATE,
  //           onTrackListener
  //         );
  
  //         hmsInstance.addEventListener(
  //           HMSUpdateListenerActions.ON_ERROR,
  //           onErrorListener
  //         );
  
  //         hmsInstance.join(
  //           new HMSConfig({ authToken: token, username: USERNAME })
  //         );
  //       } catch (error) {
  //         navigate("HomeScreen");
  //         console.error(error);
  //         Alert.alert("Error", "Check your console to see error logs!");
  //       }
  //     };
  
  //     joinRoom();
  
  //     // When effect unmounts for any reason, We are calling leave function
  //     return () => {
  //       handleRoomLeave();
  //     };
  //   }, [navigate]);
  
  //   return {
  //     loading,
  //     leaveRoom: handleRoomLeave,
  //     peerTrackNodes,
  //     hmsInstanceRef,
  //   };
  // };
  
  // export const getPeerTrackNodeId = (peer, track) => {
  //   return peer.peerID + (track?.source ?? HMSTrackSource.REGULAR);
  // };
  
  // export const createPeerTrackNode = (peer, track) => {
  //   let isVideoTrack = false;
  //   if (track && track?.type === HMSTrackType.VIDEO) {
  //     isVideoTrack = true;
  //   }
  //   const videoTrack = isVideoTrack ? track : undefined;
  //   return {
  //     id: getPeerTrackNodeId(peer, track),
  //     peer: peer,
  //     track: videoTrack,
  //   };
  // };
  
  // export const removeNodeWithPeerId = (nodes, peerID) => {
  //   return nodes.filter((node) => node.peer.peerID !== peerID);
  // };
  
  // export const updateNodeWithPeer = (data) => {
  //   const { nodes, peer, createNew = false } = data;
  
  //   const peerExists = nodes.some((node) => node.peer.peerID === peer.peerID);
  
  //   if (peerExists) {
  //     return nodes.map((node) => {
  //       if (node.peer.peerID === peer.peerID) {
  //         return { ...node, peer };
  //       }
  //       return node;
  //     });
  //   }
  
  //   if (!createNew) return nodes;
  
  //   if (peer.isLocal) {
  //     return [createPeerTrackNode(peer), ...nodes];
  //   }
  
  //   return [...nodes, createPeerTrackNode(peer)];
  // };
  
  // export const removeNode = (nodes, peer, track) => {
  //   const uniqueId = getPeerTrackNodeId(peer, track);
  
  //   return nodes.filter((node) => node.id !== uniqueId);
  // };
  
  // export const updateNode = (data) => {
  //   const { nodes, peer, track, createNew = false } = data;
  
  //   const uniqueId = getPeerTrackNodeId(peer, track);
  
  //   const nodeExists = nodes.some((node) => node.id === uniqueId);
  
  //   if (nodeExists) {
  //     return nodes.map((node) => {
  //       if (node.id === uniqueId) {
  //         return { ...node, peer, track };
  //       }
  //       return node;
  //     });
  //   }
  
  //   if (!createNew) return nodes;
  
  //   if (peer.isLocal) {
  //     return [createPeerTrackNode(peer, track), ...nodes];
  //   }
  
  //   return [...nodes, createPeerTrackNode(peer, track)];
  // };
  