import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, KeyboardAvoidingView,ToastAndroid } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Permissions from "expo-permissions";
import { TextInput } from "react-native-gesture-handler";
import db from '../config';
import * as firebase from "firebase"; 
export default class BookTransactionScreen extends React.Component {
  constructor() { 
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedStudentId: "",
      scannedBookId: "",
      buttonState: "normal",
      transactionMessage :""
    };
  }
  getCameraPermission = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false,
    });
  };
  handledBarCodeScanned = async ({ type, data }) => {
    const buttonState = this.state.buttonState;
    if (buttonState === "BookID") {
      this.setState({
        scanned: true,
        buttonState: "normal",
        scannedBookId: data,
      });
    } else if (buttonState === "StudentID") {
      this.setState({
        scanned: true,
        buttonState: "normal",
        scannedStudentId: data,
      });
    }

  };
  handleTransaction=async()=>{
    console.log("Submit was pressed")
    var transactionType = await this.checkBookEligibility();
    console.log(transactionType);
    if(!transactionType){
        Alert.alert("Book doesn't exist in Library!");
        this.setState({
          scannedStudentId:'',
          scannedBookId:''
        })
    }
    else if(transactionType === "Issue"){

      var isStudentEligible =  await this.checkStudentEligibilityForBookIssue();
      if(isStudentEligible){
    await this.initiateBookIssue();
        Alert.alert("Book Issued!")
      }
    }
    else{
      var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
      if(isStudentEligible){
        await this.initiateBookReturn();
        Alert.alert("Book Returned!");
      }
    }
  }
  initiateBookIssue=async()=>{
          // add a trasaction
      db.collection("transactions").add({
        "studentId": this.state.scannedStudentId,
        "bookId":this.state.scannedBookId,
        "transactionType": "Issue",
        "date": firebase.firestore.Timestamp.now().toDate()
      });
      

      db.collection("books").doc(this.state.scannedBookId).update({"bookAvailability" : false});

      db.collection("students").doc(this.state.scannedStudentId).update({
        "numberOfBooksIssued" : firebase.firestore.FieldValue.increment(1)
      });

      ToastAndroid.show("Book Issued",ToastAndroid.SHORT)
      Alert.alert("Book Issued")
      this.setState({
        scannedBookId: "",
        scannedStudentId:"",
      })
       
  }
  
  initiateBookReturn=async()=>{
    db.collection("transactions").add({
      "studentId": this.state.scannedStudentId,
      "bookId":this.state.scannedBookId,
      "transactionType": "Return",
      "date": firebase.firestore.Timestamp.now().toDate()
    });


    db.collection("books").doc(this.state.scannedBookId).update({"bookAvailability" :true});

    db.collection("students").doc(this.state.scannedStudentId).update({
      "numberOfBooksIssued" : firebase.firestore.FieldValue.increment(-1)
    });

   ToastAndroid.show("Book Returned",ToastAndroid.SHORT)
   Alert.alert("Book Returned")

    this.setState({
      scannedBookId: "",
      scannedStudentId:"" 
    })
  }

  checkBookEligibility=async()=>{
      var bookExist = await db.collection("books").where("bookID","===", this.state.scannedBookId).get()
      var transactionType = "";
      console.log(this.state.scannedBookId);
      console.log(bookExist.docs);
      if(bookExist.docs.length ==0){
        transactionType = false;
        console.log("book does not exist")
      }else{
        bookExist.docs.map((doc)=>{
          var book = doc.data();
          if(book.bookAvailability){
            transactionType="Issue";
          }
          else{
            transactionType="Return";
          }
          console.log("Book is there with flag as"+ transactionType)
        })
      }
      return transactionType;
  }
  
  checkStudentEligibilityForBookIssue=async()=>{
   var studentRef= await db.collection("students").where("studentID", "==", this.state.scannedStudentId).get()
    var isStudentEligible = "";
    if(studentRef.docs.length === 0){
      this.setState({
        scannedBookId: "",
        scannedStudentId:"" 
      })
      isStudentEligible = false;
      Alert.alert("The student ID doesnt exist in the database")
    }else{
      studentRef.docs.map((doc)=>{
          var student = doc.data();
          if(student.numberOfBooksIssued <2){
            isStudentEligible = true
          }else{
            isStudentEligible = false;
            this.setState({
              scannedBookId: "",
              scannedStudentId:"" 
            })
            Alert.alert("Maximum number of books are issued by this student ")
          }
      })
    }
    return isStudentEligible;
  }
  checkStudentEligibilityForBookReturn=async()=>{
   const transactionRef= await  db.collection("transactions").where("bookId", "==",this.state.scannedBookId).limit(1).get()
    var isStudentEligible = "";
    transactionRef.docs.map((doc)=>{
      var lastTransaction = doc.data();
      if(lastTransaction.studentId === this.state.scannedStudentId){
        isStudentEligible = true;
      }else{
        isStudentEligible = false;
        this.setState({
          scannedBookId:'',
          scannedStudentId:'',
        })
        Alert.alert("This book was not issued by this student!")
      }
    })
  }
  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;
    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handledBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView  style={styles.container} behavior="padding" enabled>
          <View>  
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: "center", fontSize: 30 }}>Wily App</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
            onChangeText={(text)=>{
              this.setState({
                scannedBookId:text
              })
            }}
              style={styles.inputBox}
              placeholder="Book ID"
              value={this.state.scannedBookId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermission("BookID");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
            onChangeText={(text)=>{
              this.setState({
                scannedStudentId:text
              })
            }}
              style={styles.inputBox}
              placeholder="Student ID"
              value={this.state.scannedStudentId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermission("StudentID");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>

          </View>
          <TouchableOpacity onPress={()=>{
            console.log("Submit was pressed")
            this.handleTransaction()}}style = {styles.submitButton}><Text style = {styles.submitButtonText}>Submit</Text></TouchableOpacity>
        </KeyboardAvoidingView>
      );
    } 
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  inputView: {
    flexDirection: "row",
    margin: 20,
  },
  inputBox: {
    width: 200, 
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: "#66BB6A",
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
  submitButton:{
    backgroundColor:"#FBC02D",
    width:100,
    height:50,
  },
  submitButtonText:{
    fontSize:20,
    textAlign:"center",
    fontWeight:'bold',
    color:"white",
    padding:10,
  }
});
