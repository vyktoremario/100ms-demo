import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

const HomeScreen = ({ handleJoinPress }) => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <TouchableOpacity
        onPress={handleJoinPress}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: "#2471ED",
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 20, color: "#ffffff" }}>Join Room</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

// import { View, Text, TouchableHighlight } from "react-native";
// import React, { useEffect, useState } from "react";
// import { Camera } from "expo-camera";
// import { Audio } from "expo-av";

// const HomeScreen = ({ navigate }) => {
//   const [hasCameraPermission, setHasCameraPermission] = useState(null);
//   const [hasAudioPermission, setHasAudioPermission] = useState(null);
//   const [camera, setCamera] = useState(null);
//   const [image, setImage] = useState(null);
//   const [type, setType] = useState(Camera.Constants.Type.back);

//   const getCameraPermission = async () => {
//     const cameraStatus = await Camera.requestCameraPermissionsAsync();
//     setHasCameraPermission(cameraStatus.status === "granted");
//   };

//   const getAudioPermission = async () => {
//     await Audio.requestPermissionsAsync()
//       .then((permission) => {
//         setHasAudioPermission(permission.granted);
//       })
//       .catch((err) => console.log(err));
//   };

//   useEffect(() => {
//     getCameraPermission();
//     getAudioPermission();
//   }, []);

//   // Function to handle "Join Room" button press
//   const handleJoinPress = async () => {
//     if (hasCameraPermission && hasAudioPermission) {
//       navigate("RoomScreen");
//     } else {
//       console.log("Permission Not Granted!");
//     }
//   };

//   return (
//     <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//       <TouchableHighlight
//         onPress={handleJoinPress}
//         underlayColor="#143466"
//         style={{
//           paddingHorizontal: 20,
//           paddingVertical: 12,
//           backgroundColor: "#2471ED",
//           borderRadius: 8,
//         }}
//       >
//         <Text style={{ fontSize: 20, color: "#ffffff" }}>Join Room</Text>
//       </TouchableHighlight>
//     </View>
//   );
// };

// export default HomeScreen;
