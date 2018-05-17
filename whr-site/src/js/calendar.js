window.WHR = (function (WHR) {
    (function (Date, undefined) {
        var origParse = Date.parse, numericKeys = [1, 4, 5, 6, 7, 10, 11];
        Date.parse = function (date) {
            var timestamp, struct, minutesOffset = 0;

            // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
            // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
            // implementations could be faster
            //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
            if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
                // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
                for (var i = 0, k; (k = numericKeys[i]); ++i) {
                    struct[k] = +struct[k] || 0;
                }

                // allow undefined days and months
                struct[2] = (+struct[2] || 1) - 1;
                struct[3] = +struct[3] || 1;

                if (struct[8] !== 'Z' && struct[9] !== undefined) {
                    minutesOffset = struct[10] * 60 + struct[11];

                    if (struct[9] === '+') {
                        minutesOffset = 0 - minutesOffset;
                    }
                }

                timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
            }
            else {
                timestamp = origParse ? origParse(date) : NaN;
            }

            return timestamp;
        };
    }(Date));

    var apiKey = 'AIzaSyBToE7lpYlcvs4wCjBzJ-JZEukfbudIXJ8';
    var scopes = 'https://www.googleapis.com/auth/calendar';
    var calendarId = 'whitehouseringstead@gmail.com';
    var calendar2 = "opiaa2jh32akudmvqsn3sma9n0@group.calendar.google.com";

    function getCalendar() {
        var today = new Date();
        var fridays = d3.timeFridays(new Date(), d3.timeFriday.offset(today, 52))
        // var extent = d3.extent(fridays);
        var timeMin = fridays[0].toISOString();
        var url = "https://www.googleapis.com/calendar/v3/calendars/" + calendar2 + "/events?key=" + apiKey + "&timeMin=" + timeMin;
        return fetch(url)
            .then(function (response) {
                if (response.status === 200) {
                    return response.json();
                }
                throw "Failed to fetch calendar data";
            })
            .then(function (data) {
                console.log("DATA", data);
                var dates = data.items.map(function (event) {
                    var date = event.start.date.split("-");
                    return {
                        date: new Date(date[0], date[1] - 1, date[2]),
                        busy: event.extendedProperties ? event.extendedProperties.public.busy : false
                    }
                });
                console.log("DATA: ", dates);
                var i = 0;
                return fridays.map(function (friday) {

                });
            });
    }

    function drawCalendar(data) {
        var minDate = d3.min(data, function (d) {
            return new Date(d.date);
        });
        var maxDate = d3.max(data, function (d) {
            return new Date(d.date);
        });

        var cellMargin = 4, cellSize = 30;

        var monthName = d3.timeFormat("%B");//,

        var weeks = d3.timeFridays(minDate, maxDate);
        console.log("WEEKS", weeks);
        var months = weeks.reduce(function (accum, wk) {
            var grp = accum[wk.getMonth()];
            if (!grp) {
                grp = accum[wk.getMonth()] = [];
            }
            grp.push(wk);
            return accum;
        }, []).filter(function (a) {
            return a;
        });

        var div = d3.select("#calendar").selectAll("div")
            .data(months)
            .enter().append("div")
            .attr("class", "month");

        div.append("div")
            .attr("class", "month-title")
            .text(function (d) {
                return monthName(d[0]);
            });

        var svg = div.append("svg")
            .attr("class", "month-block")
            .attr("width", (cellSize * 7) + (cellMargin * 8))
            .attr("height", function (d) {
                var rows = d.length;
                return (cellSize * rows) + (cellMargin * (rows + 1)) + 20; // the 20 is for the month labels
            })
            .append("g");

        var block = svg.selectAll("g.week")
            .data(function (d) {
                return d;
            })
            .enter()
            .append("g")
            .attr("class", "week")
            .attr("transform", function (d, i) {
                return "translate(0 " + i * (cellSize + cellMargin) + ")";
            });

        var day = block.selectAll("rect.day")
            .data(function (wk) {
                return d3.timeDays(wk, d3.timeWeek.offset(wk, 1))
                    .map(function (day) {
                        return {
                            date: day,
                            highlight: day.getMonth() === wk.getMonth()
                        }
                    });
            })
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + ((i * cellSize) + (i * cellMargin) + cellMargin) + " 0)"
            });

        var rect = day.append("rect")
            .attr("class", function (d) {
                return "day" + (d.highlight ? " day-in-month" : "")
            })
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 3).attr("ry", 3); // rounded corners

        var text = day.append("text")
            .attr("class", "day-num")
            .attr("x", cellSize / 2)
            .attr("y", cellSize / 2 + 2)
            .text(function (d) {
                return d.date.getDate()
            });
    }

    function formatDate(d) {
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    }

    // The Calendar entry to create
    function fetchFreeBusyData(timeMin, timeMax) {
        return new Promise(function (resolve, reject) {
            gapi.client.request({
                'path': '/calendar/v3/freeBusy',
                'method': 'POST',
                'body': {
                    "items": [
                        {
                            "id": calendarId
                        }
                    ],
                    "timeMin": timeMin + "T00:00:00.000Z",
                    "timeMax": timeMax + "T00:00:00.000Z"
                },
                'callback': function (response) {
                    var busy = [];
                    var busyList = response.calendars[calendarId].busy;
                    for (var n = 0; n < busyList.length; n++) {
                        var start = Date.parse(busyList[n].start);
                        var end = Date.parse(busyList[n].end);

                        busy.push({start: start, end: end});
                    }

                    resolve({
                        date: timeMin,
                        busy: busy
                    });
                }
            });
        });
    }

    function init() {
        gapi.client.setApiKey(apiKey);
        gapi.auth.init();

        var today = new Date();
        var month = today.getMonth();
        var year = today.getFullYear();

        var startMonth = 2; // March
        var promises = [];
        for (var n = startMonth; n < 8; n++) {
            var year_adjusted = year;
            var month_adjusted = n;
            if (n === 12) {
                year_adjusted++;
                month_adjusted -= 12;
            }

            var d1 = new Date(year_adjusted, month_adjusted, 1);
            var d2 = new Date(year_adjusted, month_adjusted + 1, 1);
            var timeMin = formatDate(d1);
            var timeMax = formatDate(d2);
            console.log('d: ' + d1 + ', timeMin: ' + timeMin + ', timeMax: ' + timeMax);

            var test = new Date(today.getFullYear(), month, 1);
            if (test > d1)
                continue;

            promises.push(fetchFreeBusyData(timeMin, timeMax));
        }
        Promise.all(promises).then(function (data) {
            drawCalendar(data);
        });
    }

    WHR.calendar = {
        init: function () {
            console.log("Calendar init");
            // gapi.client.load('calendar', 'v3', function () {
            //     console.log("Calendar api loaded");
            //     init();
            // });
            getCalendar();
        }
    };
    return WHR;
})(window.WHR || {});
