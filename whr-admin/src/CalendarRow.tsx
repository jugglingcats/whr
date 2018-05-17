import * as React from "react";
import * as d3 from "d3";
import {CalendarData, calendarId, Event, fromRemoteEvent} from "./App";

type CalendarRowProps = {
    date: Date,
    event?: Event
}

type CalendarRowState = {
    edit: boolean,
    event?: Event,
    editProperties?: CalendarData
}

export class CalendarRow extends React.Component<CalendarRowProps, CalendarRowState> {
    private events: any;

    constructor(props: CalendarRowProps) {
        super(props);

        this.state = {
            edit: false,
            event: props.event
        };
        this.create = this.create.bind(this);
        this.save = this.save.bind(this);

        const client: any = gapi.client;
        this.events = client.calendar.events;
    }

    create() {
        const {date} = this.props;
        const adjusted = d3.timeHour.offset(date, 3);
        this.events.insert({
            "calendarId": "opiaa2jh32akudmvqsn3sma9n0@group.calendar.google.com",
            "resource": {
                "start": {
                    "date": adjusted.toISOString().substr(0, 10)
                },
                "end": {
                    "date": d3.timeWeek.offset(adjusted, 1).toISOString().substr(0, 10)
                },
                "description": "Generated by admin app - do not edit!",
            }
        }).then((response: any) => {
            this.setState({
                event: fromRemoteEvent(response.result)
            });
            console.log("Response", response);
        })
    };

    save() {
        const event = this.state.event!;
        this.events.update({
            "calendarId": calendarId,
            "eventId": event.id,
            "resource": {
                "start": event.start,
                "end": event.end,
                "extendedProperties": {
                    "private": this.state.editProperties
                },
                "summary": "MODIFIED"
            }
        }).then((response: any) => {
            console.log("RESPONSE", response);
            this.setState({
                event: fromRemoteEvent(response.result),
                edit: false
            })
        }, function (err: any) {
            console.error("Execute error", err);
        });
    };

    render() {
        const client: any = gapi.client;
        const events: any = client.calendar.events;
        const {date} = this.props;

        const edit = () => {
            this.setState({
                edit: true,
                editProperties: {...this.state.event!.properties}
            })
        };

        if (!this.state.event) {
            return <tr className="week">
                <td className="date">{d3.timeFormat("%a %b %d, %Y")(date)}</td>
                <td className="table-left" colSpan={6}>
                    <i>This week has not been created yet</i>
                </td>
                <td className="actions">
                    <button onClick={this.create}>Create</button>
                </td>
            </tr>
        }

        if (this.state.edit) {
            const properties = this.state.editProperties!;

            const update = (e: any) => {
                console.log("target", e.target.name, e.target.value);
                properties[e.target.name] = e.target.value;
                this.setState({
                    editProperties: properties
                })
            };

            return <tr className="week">
                <td className="date">{d3.timeFormat("%a %b %d, %Y")(date)}</td>
                <td className="table-centre">
                    <select name="booked" onChange={update} value={properties.booked || "No"}>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </td>
                <td className="name">
                    <input type="text" placeholder="enter name/ref" name="name" value={properties.name}
                           onChange={update}/>
                </td>
                <td className="price">
                    <input type="text" placeholder="enter price" name="price" value={properties.price}
                           onChange={update}/>
                </td>
                <td className="table-centre">
                    <select name="offer" value={properties.offer} onChange={update}>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </td>
                <td className="price">
                    <input type="text" placeholder="offer price" name="offerPrice" value={properties.offerPrice}
                           onChange={update}/>
                </td>
                <td className="table-centre">
                    <select name="beds" onChange={update} value={properties.beds || 0}>
                        <option value={0}>None</option>
                        <option>1</option>
                        <option>2</option>
                        <option value={3}>3</option>
                        <option>4</option>
                        <option>5</option>
                        <option>6</option>
                        <option>7</option>
                        <option>8</option>
                        <option>9</option>
                    </select>
                </td>
                <td className="actions">
                    <button onClick={this.save}>Save</button>&nbsp;
                    <button onClick={() => this.setState({edit: false})}>Cancel</button>
                </td>
            </tr>
        }

        const properties = this.state.event.properties || {};
        console.log("PROPERTIES: ", properties);
        return <tr className="week">
            <td className="date">{d3.timeFormat("%a %b %d, %Y")(date)}</td>
            <td className="table-centre">
                {properties.booked || "No"}
            </td>
            <td className="name">
                {properties.name || "Not specified"}
            </td>
            <td className="table-centre">
                {properties.price || "No price set"}
            </td>
            <td className="table-centre">
                {properties.offer ? "Yes" : "No"}
            </td>
            <td className="table-centre">
                {properties.offer ? properties.offerPrice || "Not specified" : "N/A"}
            </td>
            <td className="table-centre">
                {properties.beds || 0}
            </td>
            <td className="actions">
                <button onClick={edit}>Edit</button>
            </td>
        </tr>

    }
}