import * as React from "react";
import * as moment from "moment";
import {descending} from "d3-array";

export class ContactList extends React.Component<{ authToken: string }, any> {
    state: any = {
        expanded: {}
    };

    componentDidMount() {
        fetch("https://ls3yjgl4li.execute-api.eu-west-1.amazonaws.com/latest/contact/list", {
            headers: {
                Authorization: this.props.authToken
            }
        }).then(response => {
            return response.json()
        }).then(data => {
            this.setState({
                items: data
            })
        })
    }

    setResponded(id: string, responded: "Yes" | "No") {
        fetch("https://ls3yjgl4li.execute-api.eu-west-1.amazonaws.com/latest/contact/" + id + "/responded/" + responded, {
            method: "POST",
            headers: {
                Authorization: this.props.authToken
            }
        }).then(response => {
            return response.json()
        }).then(data => {
            this.setState({
                items: data
            })
        })
    }

    deleteItem(id: string) {
        fetch("https://ls3yjgl4li.execute-api.eu-west-1.amazonaws.com/latest/contact/" + id, {
            method: "DELETE",
            headers: {
                Authorization: this.props.authToken
            }
        }).then(response => {
            return response.json()
        }).then(data => {
            this.setState({
                items: data
            })
        })
    }

    render() {
        console.log("DATA: ", this.state.items);
        const expand = (id: string, e: boolean) => {
            const expanded = {...this.state.expanded};
            if (e) {
                expanded[id] = true;
            } else {
                delete expanded[id];
            }
            this.setState({
                expanded: expanded
            })
        };

        return this.state.items && <div>
            <p className="App-intro">Enquiries from site contact form</p>
            <table cellPadding={6} cellSpacing={0}>
                <thead>
                <tr>
                    <th>Received</th>
                    <th>Email</th>
                    <th>Responded</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {
                    !this.state.items || this.state.items.length === 0 &&
                    <tr>
                        <td className="table-centre" colSpan={4}>NO ENQUIRIES FOUND</td>
                    </tr>
                    ||
                    this.state.items.sort(descending).map((item: any) => [
                        <tr>
                            <td className="date table-centre">{moment(item.time).fromNow()}</td>
                            <td className="table-left"><a href={"mailto:" + item.email}>{item.email}</a></td>
                            <td className="table-centre">{item.responded || "No"}</td>
                            <td className="table-centre">
                                {
                                    this.state.expanded[item.id] &&
                                    <button onClick={() => expand(item.id, false)}>Hide</button>
                                    ||
                                    <button onClick={() => expand(item.id, true)}>Show</button>
                                }
                                &nbsp;
                                {
                                    item.responded === "Yes" &&
                                    <button onClick={() => this.setResponded(item.id, "No")}>Not Responded</button> ||
                                    <button onClick={() => this.setResponded(item.id, "Yes")}>Responded</button>

                                }
                                &nbsp;
                                <button onClick={() => this.deleteItem(item.id)}>Delete</button>
                            </td>
                        </tr>,
                        <tr>
                            {this.state.expanded[item.id] &&
                            <td className="table-left" colSpan={6}>{item.message}</td>
                            }
                        </tr>
                    ])
                }
                </tbody>
            </table>
        </div> || <div>Loading...</div>
    }
}