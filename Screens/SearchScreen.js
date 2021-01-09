import React from "react";
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity } from "react-native";

import db from "../config"
export default class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.state={
            allTransactions:[],
            lastVisibleTransaction: null,
            search:''
        }
    }           

    componentDidMount=async()=>{
        const query = await db.collection("transactions").limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions,doc.data()],
                lastVisibleTransaction: doc,
            })
        })
        
    }

    searchTransactions=async(text)=>{
        var enterText = text.split("");
        var text = text.toUpperCase();
        if(enterText[0].toUpperCase()==="B"){
            const transaction = db.collection("transactions").where("bookId","==",text).get()
            transaction.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc,
                })
            })
        }
        else if(enterText[0].toUpperCase() === "S"){
            const transaction = db.collection("transactions").where("studentId", "==", text).get()
            transaction.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc,
                })
            })
        }
        
    }
    render(){
        return(
            <View style ={styles.container}>
                <View style={styles.searchBar}>
                    <TextInput style={styles.bar}
                    placeholder="Enter Book ID Or Student ID..."
                    onChangeText={(text)=>{
                        this.setState({
                            search:text,
                        })
                    }}
                    value={this.state.search}
                    />
                    <TouchableOpacity style={styles.searchButton} 
                    onPress={()=>{
                        this.searchTransactions(this.state.search)
                    }}>
                        <Text>Search</Text>
                        </TouchableOpacity>
                </View>
 <FlatList
                    data ={ this.state.allTransactions }
                   renderItem ={({item})=>(
                       <View style = {{borderBottomWidth:2}}>
                            <Text>{"Book ID: " + item.bookId}</Text>
                            <Text>{"Student ID: " + item.studentId}</Text>
                            <Text>{"Transaction Type: " + item.transactionType}</Text>
                            <Text>{"Date: " + item.date}</Text>

                       </View>
                   )} 
                   keyExtractor = {(item, index)=>{index.toString() }}
                   onEndReached = {this.fetchMoreTransactions}
                   onEndReachedThreshold = {0.7}
            />
            </View>
           
        )
    }

    fetchMoreTransactions=async()=>{
     
        var text = this.state.search.toUpperCase();
        var enterText = text.split("");
        if(enterText[0].toUpperCase()==="B"){
            const transaction = db.collection("transactions").where("bookId","==",text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
            transaction.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc,
                })
            })
        }
        else if(enterText[0].toUpperCase() === "S"){
            const transaction = db.collection("transactions").where("studentId", "==", text).startAfter(this.state.lastVisibleTransaction).limit(10).get()
            transaction.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc,
                })
            })
        }
    }

}
const styles = StyleSheet.create({
    container:{
        flex:1,
        marginTop:20,
    },
    searchBar:{
        flexDirection:"row",
        height:40,
        width:"auto",
        borderWidth:0.5,
        alignItems:"center",
        backgroundColor:"grey"
    },
    bar:{
        borderWidth:2,
        height:30,
        width:300,
        paddingLeft:10
    },
    searchButton:{
        borderWidth:1,
        height:30,
        width:50,
        justifyContent:"center",
        alignItems:"center",
        backgroundColor:"green",
    }
})