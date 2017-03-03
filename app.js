// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

process.env.DEBUG = 'actions-on-google:*';
let ApiAssistant = require('actions-on-google').ApiAiAssistant;
let firebaseAdmin = require('firebase-admin');
let express = require('express');
let bodyParser = require('body-parser');
let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

// API.AI actions
const WELCOME_ACTION = 'input.welcome';
//const REQUEST_NAME_PERMISSION_ACTION = 'request_name_permission';
const REQUEST_LOC_PERMISSION_ACTION = 'request_location_permission';
const GET_CURRENT_WEATHER_ACTION = 'get_current_weather';
const UNHANDLED_DEEP_LINK_ACTION = 'deeplink.unknown';

// Entities/Firebase data keys
const LOCATION_DATA = 'location';
// const NAME_DATA = 'name';
const MEOW_SRC = "https://freesound.org/data/previews/110/110011_1537422-lq.mp3";

var serviceAccount = require("./project-8780775258827865590-firebase-adminsdk-63asv-da6ff3dbac.json");

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://project-8780775258827865590.firebaseio.com"
});

  /*function sayWeatherTest (forecast) {
    let speechOutput = '<speak>' + 'Hold on, I\'m contacting Poncho right now for today\'s weather.' +
      '<audio src="' + MEOW_SRC + '"></audio>' + 'ohhhhhh kayyyyy' + '<break time="1000ms"'+ 'Poncho says, ' +
      forecast + 'Remember to check in with Poncho again tomorrow. Have a great day.' + '</speak>';
      
      console.log("Inside sayWeatherTest, speechOutput:\n");
      console.log(speechOutput);
  }

  function processWeatherTest (responseText) {
    var json_obj = JSON.parse(responseText);
    
    console.log("Inside processWeatherTest, responseText:\n");
    console.log(responseText);
    
    var forecast = json_obj.data.body;
    
    console.log("Inside processWeatherTest, forecast:\n");
    console.log(forecast);
    
    sayWeatherTest (forecast);
  }

  function getWeatherTest (zipcode) {
    let url = "https://api.poncho.is/weather/forecast/" + zipcode;
    //var response = htttpsync(url);
    //return process(response);
    console.log("Inside getWeatherTest, url:\n");
    console.log(url);

    httpGetAsync(url, processWeatherTest);
  }

  function httpGetAsync(theUrl, callback)
  {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
  }

  function httpSync(theUrl)
  {
    var xmlHttp = new XMLHttpRequest();

    xmlHttp.open("GET", theUrl, false); // true for asynchronous 
    xmlHttp.send(null);
    return xmlHttp.responseText;
  }

app.get('/test', function(req, res) {
  res.send(getWeatherTest("10014"));
});*/

// [START YourAction]
app.post('/', function (req, res) {
  console.log('Request headers: ' + JSON.stringify(req.headers));
  console.log('Request body: ' + JSON.stringify(req.body));

  const assistant = new ApiAssistant({request: req, response: res});

  /*function unhandledDeepLinks (assistant) {
    assistant.ask(`Welcome to your Psychic! I can guess many things about \
      you, but I cannot make guesses about \
      ${assistant.getRawInput()}. \
      Instead, I shall guess your name or location. Which do you prefer?`);
  }*/

  /*function requestNamePermission (assistant) {
    let permission = assistant.SupportedPermissions.NAME;
    assistant.data.permission = permission;
    return requestPermission(assistant, permission, NAME_DATA, sayName);
  }*/

  function requestLocationPermission (assistant) {
    let permission = assistant.SupportedPermissions.DEVICE_COARSE_LOCATION;
    assistant.data.permission = permission;
    return requestPermission(assistant, permission, LOCATION_DATA, getWeather);
  }

  function requestPermission (assistant, permission, firebaseKey, speechCallback) {
    return new Promise(function (resolve, reject) {
      let userId = assistant.getUser().user_id;
      firebaseAdmin.database().ref('users/' + userId)
        .once('value', function (data) {
          if (data && data.val() && data.val()[firebaseKey]) {
            speechCallback(data.val()[firebaseKey]);
            resolve();
            //resolve(assistant.tell(speechOutput));
          } else {
            resolve(assistant.askForPermission('Hi. Poncho is a weather cat from Brooklyn. He tells you the weather everyday, but he does it with a style that will make you smile. Weather without location is pretty lame.', permission));
          }
        });
    });
  }


  function sayWeather (forecast) {
    let speechOutput = '<speak>' + 'Hold on, I\'m contacting Poncho right now for today\'s weather. <break time="5s" /> ' +
      '<audio src="' + MEOW_SRC + '"></audio>' + '<break time="5s" /> ' + ' ohhhhhh kay ' + '<break time="5s" /> '+ 'Poncho says, ' +
      forecast + 'Remember to check in with Poncho again tomorrow. Have a great day.' + '</speak>';
      assistant.tell(speechOutput);
    /*return "<speak> Hold on, I'm contacting Poncho right now for today's weather. </speak>" +
    ""
    `<speak>I am reading your mind now. \
      <break time="2s"/> This is easy, you are in ${city} \
      <break time="500ms"/> That is a beautiful town. \
      <break time="500ms"/> Okay! I am off to read more minds.</speak>`;*/
  }

  function processWeather (responseText) {
    var json_obj = JSON.parse(responseText);
    console.log(responseText);
    var forecast = json_obj.data.body;
    sayWeather (forecast);
  }

  function getWeather (zipcode) {
    let url = "https://api.poncho.is/weather/forecast/" + zipcode;
    //var response = htttpsync(url);
    //return process(response);
    httpGetAsync(url, processWeather);
  }

  // Fulfill action business logic
  function getPonchoWeather (assistant) {
    if (assistant.isPermissionGranted()) {
      let zipcode = assistant.getDeviceLocation().zipCode;
      let firebaseKey = LOCATION_DATA;
      let speechCallback = sayWeather;
      let userId = assistant.getUser().user_id;

      getWeather(zipcode);
      // Save [User ID]:[{location>: <data>}] to Firebase
      // Note: Users can reset User ID at any time.
      /*firebaseAdmin.database().ref('users/' + userId).update({
        [firebaseKey]: zipcode
      });*/


    } else {
      // Response shows that user did not grant permission
      assistant.tell(`<speak>Wow! <break time="1s"/> Poncho \
        has gone on a bender and is unreachable. I hope he's okay. \
        I'll check in with him later for a weather update.</speak>`);
    }
  }

  function httpGetAsync(theUrl, callback)
  {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
  }

  let actionMap = new Map();
  actionMap.set(WELCOME_ACTION, requestLocationPermission);
  //actionMap.set(UNHANDLED_DEEP_LINK_ACTION, unhandledDeepLinks);
  //actionMap.set(REQUEST_NAME_PERMISSION_ACTION, requestNamePermission);
  //actionMap.set(REQUEST_LOC_PERMISSION_ACTION, requestLocationPermission);
  actionMap.set(GET_CURRENT_WEATHER_ACTION, getPonchoWeather);
  actionMap.set(REQUEST_LOC_PERMISSION_ACTION, requestLocationPermission)

  assistant.handleRequest(actionMap);
});
// [END YourAction]

if (module === require.main) {
  // [START server]
  // Start the server
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('App listening on port %s', port);
  });
  // [END server]
}

module.exports = app;
