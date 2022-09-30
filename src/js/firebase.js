// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDP0F82jTlfDZDR4nPyRKc1Gy4j_eZ4PT4",
  authDomain: "new-york-tech-week.firebaseapp.com",
  projectId: "new-york-tech-week",
  storageBucket: "new-york-tech-week.appspot.com",
  messagingSenderId: "763279185195",
  appId: "1:763279185195:web:7d23e6a59a5e4868fca16e",
  measurementId: "G-YV7SH5YHQB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export const registerToDatabase = async (application) => {
  try {
    await addDoc(collection(db, "attendees"), application);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export const registerEventDetailsToDatabase = async (event) => {
  try {
    await addDoc(collection(db, "events"), event);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export const getEventDetailsFromDatabase = async () => {
  try {
    const data = await fetch(
      "https://us-central1-new-york-tech-week.cloudfunctions.net/getEvents",
      {
        mode: "cors",
      }
    );

    const json = await data.json(); //extract JSON from the http response
    const events = json.data;
    events.map((event) => {
      const date = new Date(event["Event Date"]);
      var time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      if (time === "12:00 AM") time = "TBD"
      event.date = date;
      event.time = time;
      event.day = toDayName(date.getDay());
      return event;
    });
    const groupedEvents = groupBy(events, "day");
    const finalGroup = [
      groupedEvents["Monday"],
      groupedEvents["Tuesday"],
      groupedEvents["Wednesday"],
      groupedEvents["Thursday"],
      groupedEvents["Friday"],
      groupedEvents["Saturday"],
      groupedEvents["Sunday"],
    ];

    return finalGroup;
  } catch (e) {
    console.error("Error getting data: ", e);
    return [];
  }
};

function toDayName(index) {
  var weekdays = new Array(7);
  weekdays[0] = "Sunday";
  weekdays[1] = "Monday";
  weekdays[2] = "Tuesday";
  weekdays[3] = "Wednesday";
  weekdays[4] = "Thursday";
  weekdays[5] = "Friday";
  weekdays[6] = "Saturday";
  return weekdays[index];
}

function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

// export const countAttendees = async () => {
//   const querySnapshot = await getDocs(collection(db, "attendees"));
//   const size = querySnapshot.size
//   console.log("Attendees count: ", size)
// }
