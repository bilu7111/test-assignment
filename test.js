const _ = require('lodash');
const data = require("./Input.json");
const fs = require('fs');


/**
 * @function formatTime
 * @description Formats the time in 24 hour format
 * @param {*} time 
 * @returns 
 */
const formatTime = (time) => {
    time = time.replace("ET", "");
    const hours = Number(time.match(/^(\d+)/)[1]);
    const minutes = Number(time.match(/:(\d+)/)[1]);
    const AMPM = time.match(/\s(.*)$/)[1];
    if(AMPM == "PM" && hours<12) hours = hours+12;
    if(AMPM == "AM" && hours==12) hours = hours-12;
    const sHours = hours.toString();
    const sMinutes = minutes.toString();
    return {hours: sHours, minutes: sMinutes};
}

let slate_events = data.data.slate_events;

// As the sporting events is not an array, we convert it into an array
let sporting_events = [];
let s_ev_keys = Object.keys(data.data.sporting_events);
for(let i=0;i < s_ev_keys.length; i++){
  sporting_events.push(data.data.sporting_events[s_ev_keys[i]]);
}

// Getting duplicates in sporting_events array and arranging them in another array
let similar_events = [];

similar_events = _.map(sporting_events, function(o, i) {
        const eq = _.find(sporting_events, function(e, ind) {
          if (i > ind) {
            let a = _.isEqual(e.date, o.date) && _.isEqual(e.teams, o.teams) && e.time === o.time;
            return a;
          }
        })
        // if (eq) {
        //   similar_events.push(o);
        // } 
          return o;
  });

let grouped_ = [];

similar_events = similar_events.map(ev=>{
  _.remove(sporting_events, {
    date: ev.date,
    time: ev.time,
    teams: ev.teams
  });
  return {...ev, date : new Date(ev.date).toISOString()}
});

similar_events.reduce((pv, cv, i, arr)=>{
  if(pv && pv.teams === cv.teams && pv.date === cv.date && pv.time === cv.time){
      if(grouped_.length) { 
        grouped_[grouped_.length - 1] = [...grouped_[grouped_.length - 1], {...cv, date : new Date(cv.date).toISOString()}];
      }
      else {
        grouped_.push([{...cv, date : new Date(cv.date).toISOString()}]);
      }
  }
  else {
    grouped_.push([{...cv, date : new Date(cv.date).toISOString()}]);
  }
  return cv;
});

// Arranging sporting and slate events in the order as they are in output.json
let slate_events_arranged = slate_events.map((ev)=>{
  return {
      "event": {...ev, date : new Date(ev.date).toISOString()},
      "isSlate": true,
      "isStacked": false,
      "sp": ev.sp
  }
});
let sporting_events_arranged = sporting_events.map((ev)=>{
  return {
      "event": {...ev, date : new Date(ev.date).toISOString()},
      "isSlate": false,
      "isStacked": false,
      "sp": ev.sp
  }
});

// Arranging group of duplicates in the format as in output.json 
let stacked = grouped_.map((ev)=>{
  // Sorting by date in ascending order
  ev.sort(function(a,b){
      const time1 = formatTime(a.time);
      const time2 = formatTime(b.time);
      const date1 = new Date(a.date);
      const date2 = new Date(b.date);
      date1.setHours(time1.hours);
      date1.setMinutes(time1.minutes);
      date2.setHours(time2.hours);
      date2.setMinutes(time2.minutes);
      return date1 - date2;
  });
  return {
      "event": ev,
      "isSlate": false,
      "isStacked": true,
      "sp": ev[0].sp
  }
});

// Sorting by date in ascending order
const joinedArr = [...slate_events_arranged, ...sporting_events_arranged].sort(function(a,b){
    const time1 = formatTime(a.event.time);
    const time2 = formatTime(b.event.time);
    const date1 = new Date(a.event.date);
    const date2 = new Date(b.event.date);
    date1.setHours(time1.hours);
    date1.setMinutes(time1.minutes);
    date2.setHours(time2.hours);
    date2.setMinutes(time2.minutes);
    return date1 - date2;
});

const finalResult = [...joinedArr, ...stacked];

/* If you want to check the result in output */
  const json = JSON.stringify(finalResult);
  // console.log(finalResult)
  fs.writeFile('myoutput.json', json, 'utf8', (f,d,o)=>"all good");






