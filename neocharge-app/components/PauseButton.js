import React from 'react';
import { Alert, Dimensions, View, StyleSheet, Text, Image } from 'react-native';
import Colors from '../assets/colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { API } from 'aws-amplify';

const swidth = Dimensions.get('screen').width
const sheight = Dimensions.get('screen').height

const kPauseText = 'Stop Charging';
const kChargeText = 'Charge Now';
const kWaitingText = 'Working...';

export default class Dashboard extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            userEmail: '',
            pauseStyle: styles.on,
            pauseText: kPauseText
        }
    }

    async componentDidMount() {
        this.state.userEmail = await SecureStore.getItemAsync("secure_email");
        console.log("email on dashboard: " + this.state.userEmail);

        let query = {
            "queryStringParameters": {
                "userEmail": this.state.userEmail
            }
        };

        // Get Pause Status
        console.log("making pause GET request");

        let pauseIsSet = await API.get("LambdaProxy", "/pausecharge", query)
            .catch(error => { console.log(error.response) });

        console.log("pauseIsSet: " + pauseIsSet);
        console.log("pauseStatus: " + pauseIsSet);

        if (pauseIsSet) {
            this.setState({ pauseStyle: styles.on, pauseText: kChargeText })
        } else {
            this.setState({ pauseStyle: styles.off, pauseText: kPauseText })
        }
    }

    async setPause() {

        let requestBody = {
            "userEmail": this.state.userEmail
        };
        let jsonObj = {
            body: requestBody
        };

        const path = "/pausecharge";

        const curStyle = this.state.pauseStyle;
        const curText = this.state.pauseText;

        this.setState({ pauseStyle: styles.inProgress, pauseText: kWaitingText })

        await API.put("LambdaProxy", path, jsonObj)
            .then((data) => {
                if (data.body.success && data.body.paused) {
                    this.setState({ pauseStyle: styles.on, pauseText: kChargeText })
                } else if (data.body.success && (!data.body.paused)) {
                    this.setState({ pauseStyle: styles.off, pauseText: kPauseText })
                } else {
                    this.setState({ pauseStyle: curStyle, pauseText: curText })
                    Alert.alert("Device Unreachable", "This message will be sent to your NeoCharge device when it is next online.")
                }
            })
            .catch(error => {
                Alert.alert("Device Unreachable", "This message will be sent to your NeoCharge device when it is next online.")
                this.setState({ pauseStyle: curStyle, pauseText: curText })
                console.log("Pause Button Error: " + error.response)
            });
    }


    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={this.setPause.bind(this)} style={this.state.pauseStyle}>
                    <Text style={styles.boldtext}>{this.state.pauseText}</Text>
                </TouchableOpacity>
            </View>

        );
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    boldtext: {
        fontFamily: 'RedHatDisplay-Bold',
        color: Colors.secondary,
        fontSize: (swidth * 0.048),
    },
    on: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: Colors.faded,
        borderRadius: 5,
        width: (swidth * .4)
    },
    off: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: Colors.red,
        borderRadius: 30,
        width: (swidth * .4)
    },
    inProgress: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: Colors.accent2,
        borderRadius: 30,
        width: (swidth * .4)
    }
});