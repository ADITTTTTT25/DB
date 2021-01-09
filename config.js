import * as firebase from 'firebase';
require("@firebase/firestore")


  var firebaseConfig = {
    apiKey: "AIzaSyAtuAT0LQjm1Hblxf_d_bf3Ebq1uT2oXZk",
    authDomain: "wily-app-f2125.firebaseapp.com",
    projectId: "wily-app-f2125",
    storageBucket: "wily-app-f2125.appspot.com",
    messagingSenderId: "963672774312",
    appId: "1:963672774312:web:7cfa8e21c796ab165fd49d"
  };

  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore()