import * as React from 'react';
import './App.css';
import * as d3 from "d3";
import {CalendarRow} from "./CalendarRow";
import {ContactList} from "./ContactList";

export const apiKey = 'AIzaSyBToE7lpYlcvs4wCjBzJ-JZEukfbudIXJ8';
const scopes = 'https://www.googleapis.com/auth/calendar';
export const calendarId = "opiaa2jh32akudmvqsn3sma9n0@group.calendar.google.com";

export type CalendarData = {
    booked: string,
    name: string,
    price: string,
    offer: string,
    offerPrice: string,
    beds: string
}

export type Event = {
    date: Date,
    start: any,
    end: any,
    id: string,
    properties: CalendarData;
}

type AppState = {
    loaded: boolean;
    authToken?: string;
    signedIn: boolean;
    fridays: Date[];
    events: Event[];
}

export function fromRemoteEvent(event: any): Event {
    const dateInfo = event.start.date.split("-");
    const date = new Date(dateInfo[0], dateInfo[1] - 1, dateInfo[2]);
    const properties = event.extendedProperties ? event.extendedProperties.private : {}
    return {
        date: date,
        id: event.id,
        start: event.start,
        end: event.end,
        properties: {
            ...properties
        }
    }
}

class App extends React.Component<any, AppState> {
    constructor(props: any) {
        super(props);

        const fridays = d3.timeFridays(new Date(), d3.timeFriday.offset(new Date(), 80));

        this.state = {
            loaded: false,
            signedIn: false,
            fridays: fridays,
            events: []
        };
    }

    private updateSigninStatus(isSignedIn: boolean) {
        let token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
        console.log("TOKEN: ", token);
        this.setState({
            signedIn: isSignedIn,
            authToken: token
        })
    }

    public componentDidMount() {
        const gapiScript = document.createElement('script')
        gapiScript.src = 'https://apis.google.com/js/api.js?onload=onGapiLoad'
        // noinspection UnnecessaryLocalVariableJS
        const wnd: any = window;
        wnd.onGapiLoad = () => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    'clientId': "492268521833-gj7jedogjobra2scfbvjdfj0c3a8pjp9.apps.googleusercontent.com",
                    'scope': 'https://www.googleapis.com/auth/calendar',
                    // 'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                }).then(() => {
                    return gapi.client.load("calendar", "v3")
                }).then(() => {
                    this.setState({
                        loaded: true,
                    });
                    gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));
                    this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                }).catch((e) => {
                    console.error("Failed!", e);
                });
            });
        };
        document.body.appendChild(gapiScript)
        this.init();
    }

    private init() {
        const url = "https://www.googleapis.com/calendar/v3/calendars/" + calendarId + "/events?key=" + apiKey + "&timeMin=" + this.state.fridays[0].toISOString();
        fetch(url)
            .then(function (response) {
                if (response.status === 200) {
                    return response.json();
                }
                throw "Failed to fetch calendar data";
            })
            .then((data) => {
                const dates = data.items.map((event: any) => fromRemoteEvent(event));
                this.setState({
                    events: dates
                })
            });
    }

    public render() {
        const auth = () => {
            gapi.auth2.getAuthInstance().signIn();
        };
        const signOut = () => {
            gapi.auth2.getAuthInstance().signOut();
        };

        console.log("REMOTE EVENTS: ", this.state.events);//.map(d => d.date.getTime()));
        console.log("FRIDAYS: ", this.state.fridays);//.map(d => d.getTime()));
        const find = (d: Date) => {
            if (!this.state.events) {
                return undefined;
            }
            return this.state.events.find(e => e.date.getTime() === d.getTime());
        };

        /**
         * IF YOU ADD BROWSER ROUTER REMEMBER TO SET BASENAME PROPERTY!!!!!
         */
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">White House Ringstead Admin</h1>
                    {
                        (this.state.loaded && !this.state.signedIn) && <p>
                            <button onClick={auth}>Sign In</button>
                        </p>
                    }
                    {
                        (this.state.loaded && this.state.signedIn) && <p>
                            <button onClick={signOut}>Sign Out</button>
                        </p>
                    }
                </header>
                {
                    (this.state.loaded && this.state.signedIn) && <div className="weeks">
                        <ContactList authToken={this.state.authToken!}/>
                        <p className="App-intro">
                            Here you can manage the calendar
                        </p>
                        <table cellPadding={6} cellSpacing={0}>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Booked</th>
                                <th>Name</th>
                                <th>Regular Price</th>
                                <th>Offer</th>
                                <th>Offer Price</th>
                                <th>Beds</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                this.state.fridays.map(d => (
                                    <CalendarRow key={d.getTime()} date={d} event={find(d)}/>
                                ))
                            }
                            </tbody>
                        </table>
                    </div>
                }
            </div>
        );
    }
}

export default App;
