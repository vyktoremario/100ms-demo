import { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import {
  HMSSDK,
  HMSUpdateListenerActions,
  HMSConfig,
  HMSTrackType,
  HMSTrackUpdate,
  HMSPeerUpdate,
  HMSTrackSource,
  HMSLocalPeer,
} from "@100mslive/react-native-hms";
import { MODERATOR_ROOM_CODE, SPEAKER_ROOM_CODE } from "../utils/constants";
import {
  removeNodeWithPeerId,
  updateNodeWithPeer,
  updateNode,
} from "../utils/session-functions";

const ROOM_CODE = MODERATOR_ROOM_CODE; // PASTE ROOM CODE FROM DASHBOARD HERE
const AUTH_TOKEN = ""; // PASTE AUTH TOKEN FROM DASHBOARD HERE
const USERNAME = "Yomi Tester";

export const usePeerTrackNodes = ({ handleRoomEnd }) => {
  const hmsInstanceRef = useRef(null); // We will save `hmsInstance` in this ref
  const [loading, setLoading] = useState(true);
  const [peerTrackNodes, setPeerTrackNodes] = useState([]); // Use this state to render Peer Tiles
  const [micMuted, setMicMuted] = useState(null); // Setting the audio state
  const [chatMessages, setChatMessages] = useState([]);

  // receive messages
  const onMessageReceived = (message) => {
    setChatMessages((prevMessages) => [message, ...prevMessages]);
  };
  console.log("Received Message", chatMessages);

  // send bc messages
  const sendBroadcastMessage = async (message) => {
    try {
      const hmsInstance = hmsInstanceRef.current;

      const localPeer = await hmsInstance.getLocalPeer();

      const result = await hmsInstance.sendBroadcastMessage(message);

      const sentMessage = {
        message: result.message,
        messageId: result.messageId,
        recipient: {
          recipientPeer: undefined,
          recipientRoles: [], // Depending on your use case, you might need to adjust this
          recipientType: "BROADCAST",
        },
        sender: {
          _name: localPeer.name,
          peerID: localPeer.peerID,
        },
        time: new Date(),
        type: "chat",
      };

      setChatMessages((prevChatMessages) => [sentMessage, ...prevChatMessages]);
      console.log("Broadcast Message Success: ", result, sentMessage);
    } catch (error) {
      console.log("Broadcast Message Error: ", error);
    }
  };

  /**
   * Handles Room leave process
   */
  const handleRoomLeave = async () => {
    try {
      const hmsInstance = hmsInstanceRef.current;

      if (!hmsInstance) {
        return Promise.reject("HMSSDK instance is null");
      }
      // Removing all registered listeners
      hmsInstance.removeAllListeners();

      const leaveResult = await hmsInstance.leave();
      console.log("Leave Success: ", leaveResult);

      // const endRoom = await hmsInstance.endRoom("reason", false);
      // console.log("End Success: ", endRoom);

      const destroyResult = await hmsInstance.destroy();
      console.log("Destroy Success: ", destroyResult);

      // Removing HMSSDK instance
      hmsInstanceRef.current = null;

      // ending the room
      handleRoomEnd();
    } catch (error) {
      console.log("Leave or Destroy Error: ", error);
    }
  };

  const handleMuteAndUnmuteAudio = async () => {
    const localPeer = await hmsInstanceRef.current.getLocalPeer();
    const isAudioMuted = localPeer.audioTrack?.isMute();
    localPeer.localAudioTrack().setMute(!isAudioMuted);
    setMicMuted(!isAudioMuted);
  };

  const handleMuteAndUnmuteVideo = async () => {
    const localPeer = await hmsInstanceRef.current.getLocalPeer();
    const videoMuted = localPeer.videoTrack?.isMute();
    localPeer.localVideoTrack().setMute(!videoMuted);
  };

  /**
   * Handles Join Update received from {@link HMSUpdateListenerActions.ON_JOIN} event listener
   * Receiving This event means User (that is Local Peer) has successfully joined room
   * @param {Object} data - object which has room object
   * @param {Object} data.room - current {@link HMSRoom | room} object
   */
  const onJoinSuccess = (data) => {
    /**
     * Checkout {@link HMSLocalPeer | HMSLocalPeer} Class
     */
    const { localPeer } = data.room;

    // set mic state
    const audioMuted = localPeer.audioTrack?.isMute();
    setMicMuted(audioMuted);

    // Creating or Updating Local Peer Tile

    // `updateNode` function updates "Track and Peer objects" in PeerTrackNodes and returns updated list.
    // if none exist then we are "creating a new PeerTrackNode with the received Track and Peer"
    setPeerTrackNodes((prevPeerTrackNodes) =>
      updateNode({
        nodes: prevPeerTrackNodes,
        peer: localPeer,
        track: localPeer.videoTrack,
        createNew: true,
      })
    );

    // Turning off loading state on successful Room Room join
    setLoading(false);
  };

  /**
   * Handles Peer Updates received from {@link HMSUpdateListenerActions.ON_PEER_UPDATE} event listener
   * @param {Object} data - This has updated peer and update type
   * @param {HMSPeer} data.peer - Updated Peer
   * @param {HMSPeerUpdate} data.type - Update Type
   */
  const onPeerListener = ({ peer, type }) => {
    // We will create Tile for the Joined Peer when we receive `HMSUpdateListenerActions.ON_TRACK_UPDATE` event.
    // Note: We are chosing to not create Tiles for Peers which does not have any tracks
    if (type === HMSPeerUpdate.PEER_JOINED) {
      setPeerTrackNodes((prevPeerTrackNodes) =>
        updateNode({
          nodes: prevPeerTrackNodes,
          peer: peer,
          track: peer.videoTrack,
          createNew: true,
        })
      );
    }

    if (type === HMSPeerUpdate.PEER_LEFT) {
      // Remove all Tiles which has peer same as the peer which just left the room.
      // `removeNodeWithPeerId` function removes peerTrackNodes which has given peerID and returns updated list.
      setPeerTrackNodes((prevPeerTrackNodes) =>
        removeNodeWithPeerId(prevPeerTrackNodes, peer.peerID)
      );
      return;
    }

    if (peer.isLocal) {
      // Updating the LocalPeer Tile.
      // `updateNodeWithPeer` function updates Peer object in PeerTrackNodes and returns updated list.
      // if none exist then we are "creating a new PeerTrackNode for the updated Peer".
      setPeerTrackNodes((prevPeerTrackNodes) =>
        updateNodeWithPeer({ nodes: prevPeerTrackNodes, peer, createNew: true })
      );
      return;
    }

    if (
      type === HMSPeerUpdate.ROLE_CHANGED ||
      type === HMSPeerUpdate.METADATA_CHANGED ||
      type === HMSPeerUpdate.NAME_CHANGED ||
      type === HMSPeerUpdate.NETWORK_QUALITY_UPDATED
    ) {
      // Ignoring these update types because we want to keep this implementation simple.
      return;
    }
  };

  /**
   * Handles Track Updates received from {@link HMSUpdateListenerActions.ON_TRACK_UPDATE} event listener
   * @param {Object} data - This has updated track with peer and update type
   * @param {HMSPeer} data.peer - Peer
   * @param {HMSTrack} data.track - Peer Track
   * @param {HMSTrackUpdate} data.type - Update Type
   */
  const onTrackListener = ({ peer, track, type }) => {
    // on TRACK_ADDED update
    // We will update Tile with the track or
    // create new Tile for with the track and peer
    if (
      type === HMSTrackUpdate.TRACK_ADDED &&
      track.type === HMSTrackType.VIDEO
    ) {
      // We will only update or create Tile "with updated track" when track type is Video.
      // Tiles without Video Track are already respresenting Peers with or without Audio.

      // Updating the Tiles with Track and Peer.
      // `updateNode` function updates "Track and Peer objects" in PeerTrackNodes and returns updated list.
      // if none exist then we are "creating a new PeerTrackNode with the received Track and Peer".
      setPeerTrackNodes((prevPeerTrackNodes) =>
        updateNode({
          nodes: prevPeerTrackNodes,
          peer,
          track,
          createNew: true,
        })
      );

      return;
    }

    // on TRACK_MUTED or TRACK_UNMUTED updates, We will update Tiles (PeerTrackNodes)
    if (
      type === HMSTrackUpdate.TRACK_MUTED ||
      type === HMSTrackUpdate.TRACK_UNMUTED
    ) {
      // We will only update Tile "with updated track" when track type is Video.
      if (track.type === HMSTrackType.VIDEO) {
        // Updating the Tiles with Track and Peer.
        // `updateNode` function updates "Track and Peer objects" in PeerTrackNodes and returns updated list.
        // Note: We are not creating new PeerTrackNode object.
        setPeerTrackNodes((prevPeerTrackNodes) =>
          updateNode({
            nodes: prevPeerTrackNodes,
            peer,
            track,
          })
        );
      } else {
        // Updating the Tiles with Peer.
        // `updateNodeWithPeer` function updates Peer object in PeerTrackNodes and returns updated list.
        // Note: We are not creating new PeerTrackNode object.
        // handleMuteAndUnmuteAudio();
        setPeerTrackNodes((prevPeerTrackNodes) =>
          updateNodeWithPeer({
            nodes: prevPeerTrackNodes,
            peer,
          })
        );
      }
      return;
    }

    if (type === HMSTrackUpdate.TRACK_REMOVED) {
      // If non-regular track, or
      // both regular video and audio tracks are removed
      // Then we will remove Tiles (PeerTrackNodes) with removed track and received peer
      return;
    }

    /**
     * For more info about Degrade/Restore. check out {@link https://www.100ms.live/docs/react-native/v2/features/auto-video-degrade | Auto Video Degrade}
     */
    if (
      type === HMSTrackUpdate.TRACK_RESTORED ||
      type === HMSTrackUpdate.TRACK_DEGRADED
    ) {
      return;
    }
  };

  /**
   * Handles Errors received from {@link HMSUpdateListenerActions.ON_ERROR} event listener
   * @param {HMSException} error
   *
   * For more info, Check out {@link https://www.100ms.live/docs/react-native/v2/features/error-handling | Error Handling}
   */
  const onErrorListener = (error) => {
    setLoading(false);

    console.log(error?.description);
  };

  // Effect to handle HMSSDK initialization and Listeners Setup
  useEffect(() => {
    const joinRoom = async () => {
      try {
        setLoading(true);

        const hmsInstance = await HMSSDK.build();
        hmsInstanceRef.current = hmsInstance;

        let token = AUTH_TOKEN;
        if (!token) {
          token = await hmsInstance.getAuthTokenByRoomCode(ROOM_CODE);
        }

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
        hmsInstance.addEventListener(
          HMSUpdateListenerActions.ON_MESSAGE,
          onMessageReceived
        );

        hmsInstance.join(
          new HMSConfig({ authToken: token, username: USERNAME })
        );
      } catch (error) {
        handleRoomEnd();
        console.error(error);
        Alert.alert("Error", "Check your console to see error logs!");
      }
    };

    joinRoom();

    // return () => {
    //   handleRoomLeave();
    // };
    // }, [handleRoomEnd]);
  }, []);

  return {
    loading,
    leaveRoom: handleRoomLeave,
    peerTrackNodes,
    hmsInstanceRef,
    onHandleAudioMute: handleMuteAndUnmuteAudio,
    onHandleVideoMute: handleMuteAndUnmuteVideo,
    micMuted,
    chatMessages,
    sendBroadcastMessage,
    setChatMessages,
    username: USERNAME,
  };
};
