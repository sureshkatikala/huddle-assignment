import React, { Component } from 'react';
import TwitterLogin from 'react-twitter-auth';
import FacebookLogin from 'react-facebook-login';
import { GoogleLogin } from 'react-google-login';
import config from './config.json';

const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");

var firebaseconfig = {
    apiKey: "AIzaSyCDB9ZL68LagCu1067iX1MLuuZzkjrF6B8",
    authDomain: "huddle-interview.firebaseapp.com",
    databaseURL: "https://huddle-interview.firebaseio.com",
    projectId: "huddle-interview",
    storageBucket: "huddle-interview.appspot.com",
    messagingSenderId: "1025786912771"
  };

firebase.initializeApp(firebaseconfig);

let defaultApp = firebase.firestore();
let db = defaultApp.collection('users');
class App extends Component {

    constructor(props) {
        console.log(defaultApp.name);
        super(props);
        this.state = { isAuthenticated: false, user: null, token: '', jwt: '', items: [], text: '', whiteListedUsers: [], showWhiteListedUsers:'false' };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.updateWhiteListedUsers = this.updateWhiteListedUsers.bind(this);
    }

    logout = () => {
        this.setState({ isAuthenticated: false, token: '', user: null, jwt: '', items: [], text: '',whiteListedUsers: [], showWhiteListedUsers:'false' })
    };
    onFailure = (error) => {
        console.log(error);
        alert(error);
    };
    checkemail = (email) => {
        return new Promise((resolve, reject) => {
            db.where("email", "==", email)
                .get()
                .then(function (querySnapshot) {
                    let querylength = querySnapshot.size;
                    let docId;
                    querySnapshot.forEach(function (doc) {
                        docId = doc.id;
                        //doc.data() is never undefined for query doc snapshots
                        console.log(doc.id, " => ", doc.data());
                    });
                    console.log(querylength);
                    resolve({ querylength, docId });
                })
                .catch(function (error) {
                    console.log("Error getting documents: ", error);
                })
        })
    }

    googleResponse = (response) => {
        console.log(response);
        this.checkemail(response.profileObj.email).then(({ querylength, docId }) => {
            if (querylength > 0) {
                this.setState({ isAuthenticated: true, token: response.Zi.access_token, user: response.profileObj, jwt: response.tokenObj.id_token });
                console.log(response);
                console.log(docId);
                let userDocumentReference = db.doc(docId)
                userDocumentReference.update({
                    jwt: response.tokenObj.id_token,
                    userData: {
                        imageUrl: response.profileObj.imageUrl,
                        name: response.profileObj.name,
                    },
                })

            } else {
                console.log(querylength);
                alert('User not authenticated');
            }
        })
    };

    callBackendAPI = async () => {
        const response = await fetch('/express_backend');
        const body = await response.json();

        if (response.status !== 200) {
            throw Error(body.message)
        }
        return body;
    };

    handleChange(e) {
        this.setState({ text: e.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();
        if (!this.state.text.length) {
            return;
        }
        const newItem = {
            text: this.state.text,
            id: Date.now()
        };
        db.add({
            email : this.state.text
        })
        .then(docRef =>{
            console.log('Email Updated Successfully');
        })
        .catch(error => {
            console.log('Error adding the document');
        })
        this.setState(state => ({
            items: state.items.concat(newItem),
            text: ''
        }));
    }

    updateWhiteListedUsers(){
        db.get().then(querySnapshot =>{
            let jsxarray = [];
            return new Promise((resolve,reject) => {
            querySnapshot.forEach(doc => {
                let querydata = doc.data();
                jsxarray.push(
                    <div>
                        <p>Email : {querydata.email}</p>
                        {/* <p>Name: {querydata.userData.name}</p>
                        <img src={querydata.userData.imageUrl}/> */}
                    </div>
                );
                console.log(doc.id, '=>' ,doc.data());

            })
            resolve(jsxarray);
        })
        .then(jsxarray =>{
            this.setState({whiteListedUsers: jsxarray})
        })
        })
        // console.log(jsxarray);
    }
    handleshowWhiteList = () => {
        console.log(this.state);
        this.setState({showWhiteListedUsers : !this.state.showWhiteListedUsers});
        if(this.state.showWhiteListedUsers){
            this.updateWhiteListedUsers();
        }
    }
    render() {
        console.log('inside render')
        let content = !!this.state.isAuthenticated ?
            (
                <div className = 'authenticated'>
                    <p>Authenticated</p>
                    <div>
                        <img src={this.state.user.imageUrl} />
                    </div>
                    <div>
                        {this.state.user.email}
                    </div>
                    <div>
                        {this.state.user.name}
                    </div>
                    <div>
                        JWT : {this.state.jwt}
                    </div>
                    <div>
                        <div>
                            <h3>Whitelist New Users</h3>
                            <TodoList items={this.state.items} />
                            <form onSubmit={this.handleSubmit}>
                                <label htmlFor="new-todo">
                                    Whitelist a new user?
                                </label>
                                <br />
                                <input
                                    id="new-todo"
                                    onChange={this.handleChange}
                                    value={this.state.text}
                                />
                                <button>
                                    Add #{this.state.items.length + 1}
                                </button>
                            </form>
                        </div>
                    </div>
                    <div>
                        {!this.state.showWhiteListedUsers ? this.state.whiteListedUsers : null}
                    </div>
                    <div>

                        <button onClick={this.handleshowWhiteList} className="button">
                            {this.state.showWhiteListedUsers ? 'Show' : 'Hide'} all Whitelisted Users
                        </button>
                    </div>
                   
                    <div>

                        <button onClick={this.logout} className="button">
                            Log out
                        </button>
                    </div>

                </div>
            ) :
            (
                <div className = 'signin-button'>

                    <GoogleLogin
                        clientId={config.GOOGLE_CLIENT_ID}
                        buttonText="Login"
                        onSuccess={this.googleResponse}
                        onFailure={this.onFailure}
                    />
                </div>
            );

        return (
            <div className="App">
                {content}
            </div>
        );
    }
}

class TodoList extends React.Component {
    render() {
        return (
            <ul>
                {this.props.items.map(item => (
                    <li key={item.id}>{item.text}</li>
                ))}
            </ul>
        );
    }
}


export default App;

    // facebookResponse = (response) => {
    //     console.log(response);
    //     this.checkemail(response.email).then(querylength => {
    //         if (querylength > 0) {
    //             this.setState({ isAuthenticated: true, token: response.accessToken, user: response });
    //             console.log(response);
    //         } else {
    //             console.log(querylength);
    //             alert('User not authenticated');
    //         }
    //     })

    //     let postData = {

    //     }

    //     // this.createFBJWT()
    //     // .then(res => console.log(res))
    //     // .catch(err => console.log(err));
    // }