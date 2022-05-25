// ************************************************** BOOKKEEPING **************************************************************
// This file contains the functions for GET/POST req/res to the database. The 'EventRouter' file is linked so that it routes/reads
// through this file and executes all functions one at a time. After completing each function asynchronously, it contains the
// stored data and objects (kind of like a state). Then, later the 'router.js' file will use this exported file and update the
// contents on front-end.

const asyncHandler = require("express-async-handler");
const events = require("../router/models/Events");
const interests = require("../router/models/interestGroup");
// const Users = require("../router/models/Users");
// const { events } = require("../router/models/Users");
const User = require("../router/models/Users");

//Creates an event JSON object, taking info from the front-end to populate attributes based
// on the event schema 'router/models/Events.js'

const createEvent = asyncHandler(async (req, res) => {
  try {
    console.log("does this go thru", req.body);
    const makeEvent = await events.create({
      title: req.body.title,
      desc: req.body.desc,
      location: req.body.location,
      date: req.body.date,
      time: req.body.time,
      user: [],
      CurrentGroup: interests._id,
    });
    console.log(makeEvent);
    res.send(makeEvent); // the response is created AFTER request made; send the new Event JSON and console.log to show
  } catch (error) {
    res.status(400).send("Sorry, that didnt go through");
    throw new Error(error.message);
  }
});

/**
 * Retrieves the events for the logged in user.
 *
 * If the room the function is
 * requested from is in the chatroom, it will load all the events from that interest (interest stored in ``primaryInterest`` only).
 *
 * If requested from events page, will load all the events from both ``primaryInterest`` and ``secondaryInterest``.
 *
 * If no data is available, a response of undefined will be sent, setting the data on front end to not found.
 */
const getEventsForUser = asyncHandler(async (req, res) => {
  const { id, primaryInterest, secondaryInterest, room } = req.body;
  try {
    console.log(primaryInterest);
    console.log(secondaryInterest);
    console.log("ID: " + id);
    console.log("chatroom page: " + room);
    if (room == "chatroom") {
      console.log("Routed into chatroom events modal.");
      const events = await interests
        .find({ InterestName: primaryInterest })
        .populate("currentEvents", "title desc location")
        .then(function (doc) {
          console.log(doc);
          if (doc.length == 0) {
            res.send({ response: "undefined" });
          } else {
            res.send(doc[0].currentEvents);
          }
        });
    } else {
      console.log("Routed into events tab.");
      const primaryInt = await interests
        .find({ InterestName: primaryInterest })
        .populate("currentEvents", "title desc location")
        .then(function (doc) {
          console.log(doc[0].currentEvents);
          let allEvents = [];
          if (doc[0].currentEvents.length == 0) {
            res.send({ response: "undefined" });
          } else {
            for (let item = 0; item < doc[0].currentEvents.length; item++) {
              allEvents.push(doc[0].currentEvents[item]);
            }
            console.log("all events below: ");
            const secondaryInt = interests
              .find({ InterestName: secondaryInterest })
              .populate("currentEvents", "title desc location")
              .then(function (doc) {
                console.log(secondaryInterest + " events: ");
                console.log(doc[0].currentEvents);
                if (doc[0].currentEvents.length == 0) {
                  console.log(allEvents);
                  res.send(allEvents);
                } else {
                  for (
                    let item = 0;
                    item < doc[0].currentEvents.length;
                    item++
                  ) {
                    allEvents.push(doc[0].currentEvents[item]);
                  }
                  res.send(allEvents);
                }
              });
          }
        });
    }
  } catch (error) {
    console.log(error);
  }
});

// >>>>>>>>>>>>>>>> how to reference our mongodb database here?

// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const authentication = require('./authentication');
// const mongoUri = 'mongodb+srv://user:123@cluster0.1ozdh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
// mongoose.connect(mongoUri,
//   async(err)=>{
//       if(err) throw err;
//       console.log("conncted to db")

// });

// retrieve the user's token, verify its the right token, and then set their
// status to 'subscribed' for event (updating backend)
// const retrieveEventSubscription = (pushToken, setIsSubscribed) =>
// mongoose.

const addToEvent = asyncHandler(async (req, res) => {
  const { eventID, userId } = req.body;

  // check if the requester is admin

  const added = await events
    .findByIdAndUpdate(
      eventID,
      {
        $push: { user: userId },
      },
      {
        new: true,
      }
    )
    .populate("Users", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

/**
 * Adds the event created to array of event IDs in the interest referenced by the ``interestID``.
 * Returns the updated array as a JSON.
 */
const addEventToInterest = asyncHandler(async (req, res) => {
  const { eventID, interestID } = req.body;
  console.log(eventID);
  console.log(interestID);

  const added = await interests.updateOne(
    { _id: interestID },
    {
      $push: { currentEvents: [eventID] },
    },
    {
      new: true,
    }
  );

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

//'module.exports' is the instruction that tells Node.js to export functions/objects
// so other files can use this exported code
// Basically, when another file runs 'EventRoute.js', it will export and be able to use this
// function, 'createEvent'
module.exports = {
  createEvent,
  addToEvent,
  getEventsForUser,
  addEventToInterest,
};
