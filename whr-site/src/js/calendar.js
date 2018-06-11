window.WHR = (function (WHR) {
    var apiKey = 'AIzaSyBToE7lpYlcvs4wCjBzJ-JZEukfbudIXJ8';
    var scopes = 'https://www.googleapis.com/auth/calendar';
    var calendarId = 'whitehouseringstead@gmail.com';
    var calendar2 = "opiaa2jh32akudmvqsn3sma9n0@group.calendar.google.com";

    function getCalendar() {
        var today = new Date();
        var fridays = d3.timeFridays(d3.timeMonth(new Date()), d3.timeFriday.offset(today, 52))
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
                var dates = data.items.map(function (event) {
                    var date = event.start.date.split("-");
                    return {
                        date: new Date(date[0], date[1] - 1, date[2]),
                        properties: event.extendedProperties ? event.extendedProperties.private : {}
                    }
                });
                var i = 0;
                return fridays.map(function (friday) {
                    return {
                        date: friday,
                        event: dates.find(function (d) {
                            return d.date.getTime() === friday.getTime()
                        })
                    }
                });
            });
    }

    function drawCalendar(weeks) {
        var cellMargin = 4, cellSize = 30, priceSize = 64;

        var monthTitle = d3.timeFormat("%B %Y");

        var months = [];
        var month = [];
        var current = weeks[0].date.getMonth();
        for (var i = 0; i < weeks.length; i++) {
            var week = weeks[i];
            if (week.date.getMonth() === current) {
                month.push(week);
            } else {
                months.push(month);
                month = [week];
                current = week.date.getMonth();
            }
        }
        if (month.length) {
            months.push(month);
        }

        var div = d3.select("#calendar").selectAll("div")
            .data(months, function (m, i) {
                return m ? m.date : "intro"
            })
            .enter().append("div")
            .attr("class", "month")
            .append("div")
            .attr("class", "month-inner");

        div.append("div")
            .attr("class", "month-title")
            .text(function (d) {
                return monthTitle(d[0].date);
            });

        var width = (cellSize * 7) + (cellMargin * 9) + priceSize;
        var height = function (d) {
            var rows = d.length;
            return (cellSize * (rows + 1)) + (cellMargin * (rows + 1)) + 20; // the 20 is for the month labels
        };
        var svg = div.append("svg")
            .attr("class", "month-block")
            .attr("viewBox", function (d) {
                return "0,0," + width + "," + height(d)
            })
            .attr("width", width)
            .attr("height", height);

        var gdaylabels = svg.append("g")
            .attr("class", "day-labels")
            .attr("transform", function () {
                return "translate(0 5)";
            })
            .selectAll("text.day-label")
            .data(function (d) {
                return ["Fr", "Sa", "Su", "Mo", "Tu", "We", "Th"];
            })
            .enter()
            .append("text")
            .attr("x", cellSize / 2)
            .attr("y", cellSize / 2 + 2)
            .attr("class", "day-label")
            .attr("transform", function (d, i) {
                return "translate(" + ((i * cellSize) + (i * cellMargin) + cellMargin) + " 0)"
            })
            .text(function (d) {
                return d
            });

        var gweeks = svg
            .append("g")
            .attr("class", "month-weeks");

        function available(wk) {
            return wk.event && wk.event.properties.booked !== "Yes";
        }

        function offer(wk) {
            return wk.event && wk.event.properties.offer === "Yes";
        }

        var gweek = gweeks.selectAll("g.week")
            .data(function (d) {
                return d;
            })
            .enter()
            .append("g")
            .attr("class", function (wk) {
                return "week" + (available(wk) ? " week-available" : "") + (offer(wk) ? " week-offer" : "");
            })
            .attr("transform", function (d, i) {
                return "translate(0 " + (i + 1) * (cellSize + cellMargin) + ")";
            });

        var gprice = gweek.append("g")
            .attr("class", function (wk) {
                // var offer = wk.event && wk.event.properties.offer === "Yes";
                return "price" + (offer(wk) ? " price-offer" : "");
            })
            .attr("transform", function () {
                return "translate(" + ((7 * cellSize) + (7 * cellMargin) + cellMargin) + " 0)"
            });
        gprice.append("rect")
            .attr("width", priceSize)
            .attr("height", cellSize);
        gprice.append("text")
            .attr("x", 10)
            .attr("y", cellSize / 2 + 2)
            .text(function (wk) {
                if (!available(wk)) {
                    return "";
                }
                if (wk.event.properties.offer === "Yes") {
                    return "£" + wk.event.properties.offerPrice;
                }
                return wk.event.properties.price ? ("£" + wk.event.properties.price) : "enquire";
            });

        var day = gweek.selectAll("rect.day")
            .data(function (wk) {
                return d3.timeDays(wk.date, d3.timeWeek.offset(wk.date, 1));
            })
            .enter().append("g")
            .attr("transform", function (d, i) {
                return "translate(" + ((i * cellSize) + (i * cellMargin) + cellMargin) + " 0)"
            });

        var rect = day.append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 1).attr("ry", 1); // rounded corners

        day.append("path")
            .attr("class", "offer-star")
            .attr("d", "M 15.000 27.000\n" +
                "L 19.635 29.266\n" +
                "L 22.053 24.708\n" +
                "L 27.135 23.817\n" +
                "L 26.413 18.708\n" +
                "L 30.000 15.000\n" +
                "L 26.413 11.292\n" +
                "L 27.135 6.183\n" +
                "L 22.053 5.292\n" +
                "L 19.635 0.734\n" +
                "L 15.000 3.000\n" +
                "L 10.365 0.734\n" +
                "L 7.947 5.292\n" +
                "L 2.865 6.183\n" +
                "L 3.587 11.292\n" +
                "L 0.000 15.000\n" +
                "L 3.587 18.708\n" +
                "L 2.865 23.817\n" +
                "L 7.947 24.708\n" +
                "L 10.365 29.266\n" +
                "L 15.000 27.000\n" +
                "z")

        var text = day.append("text")
            .attr("class", "day-num")
            .attr("x", cellSize / 2)
            .attr("y", cellSize / 2 + 2)
            .text(function (d) {
                return d.getDate()
            });
    }

    function populateDropdown(fridays) {
        var weekTitle = d3.timeFormat("%a %e %b %Y");

        var div = d3.select("#dateSelect")
            .selectAll("option")
            .data(fridays.filter(function (d) {
                // console.log(d.event);
                return d.event && d.event.properties.booked !== "Yes"
            }))
            .enter().append("option")
            .text(function (d) {
                return weekTitle(d.date);
            })
    }

    WHR.calendar = {
        init: function () {
            return getCalendar().then(function (fridays) {
                drawCalendar(fridays);
                populateDropdown(fridays);
            });
        }
    };
    return WHR;

})(window.WHR || {});
