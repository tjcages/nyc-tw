const THREE = require("three");
const { debounce } = require("@ykob/js-util");
const {
  registerToDatabase,
  registerEventDetailsToDatabase,
  getEventDetailsFromDatabase,
} = require("../../firebase");

const SmoothScrollManager =
  require("../../smooth_scroll_manager/SmoothScrollManager").default;
const TitleObject = require("../../index/TitleObject").default;
const BuildingObject = require("../../index/BuildingObject").default;
const Ground = require("../../index/Ground").default;
const Debris = require("../../index/Debris").default;
const PostEffect = require("../../index/PostEffect").default;
const Typo = require("../../index/Typo").default;

export default function () {
  const scrollManager = new SmoothScrollManager();

  const canvas = document.getElementById("canvas-webgl");
  const renderer = new THREE.WebGL1Renderer({
    antialias: false,
    canvas: canvas,
  });
  const renderBack = new THREE.WebGLRenderTarget(
    document.body.clientWidth,
    window.innerHeight
  );
  const scene = new THREE.Scene();
  const sceneBack = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const cameraBack = new THREE.PerspectiveCamera(
    45,
    document.body.clientWidth / window.innerHeight,
    1,
    10000
  );
  const clock = new THREE.Clock();
  const texLoader = new THREE.TextureLoader();
  const ground = new Ground();
  const titleObject = new TitleObject();
  const buildingObject = new BuildingObject();
  const debris = [
    new Debris(200, -500, 200),
    new Debris(-350, -600, -50),
    new Debris(250, -750, -150),
    new Debris(-500, -900, 0),
    new Debris(300, -1100, 250),
    new Debris(-100, -1200, -300),
    new Debris(150, -1500, -100),
  ];
  const postEffect = new PostEffect(renderBack.texture);
  const typo = new Typo();
  let textures;

  const registerScroll = document.getElementById("registerScroll");
  const elemIntro = document.getElementsByClassName("js-transition-intro");

  const register = document.getElementById("register");
  const openRegister = document.getElementById("openRegister");
  // basic details
  const nameInput = document.getElementById("name");
  const socialInput = document.getElementById("social");
  const emailInput = document.getElementById("email");
  const companyInput = document.getElementById("company");
  const titleInput = document.getElementById("title");
  const typeSelect = document.getElementById("type");

  // hosting an event
  const eventDetails = document.getElementById("eventDetails");
  const eventTitleInput = document.getElementById("event-title");
  const eventDateInput = document.getElementById("event-date");
  const eventLocationInput = document.getElementById("event-location");
  const capacitySelect = document.getElementById("capacity");
  const eventLinkInput = document.getElementById("event-link");
  const eventDescriptionInput = document.getElementById("event-description");

  // submission
  const submitButton = document.getElementById("submit");
  const registerButton = document.getElementById("registerEvent");
  const successMessage = document.getElementById("success");
  const eventSuccessMessage = document.getElementById("eventSuccess");

  const resizeWindow = () => {
    canvas.width = document.body.clientWidth;
    canvas.height = window.innerHeight;
    cameraBack.aspect = document.body.clientWidth / window.innerHeight;
    cameraBack.updateProjectionMatrix();
    renderBack.setSize(document.body.clientWidth, window.innerHeight);
    renderer.setSize(document.body.clientWidth, window.innerHeight);
    postEffect.resize();
  };
  const render = () => {
    const time = clock.getDelta();
    titleObject.render(time);
    buildingObject.render(time);
    ground.render(time);
    for (var i = 0; i < debris.length; i++) {
      debris[i].render(time);
    }
    renderer.setRenderTarget(renderBack);
    renderer.render(sceneBack, cameraBack);
    postEffect.render(time);
    typo.update(time);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  };
  const renderLoop = () => {
    render();
    requestAnimationFrame(renderLoop);
  };
  const on = () => {
    window.addEventListener(
      "resize",
      debounce(() => {
        resizeWindow();
      }),
      1000
    );

    scrollManager.renderNext = () => {
      if (scrollManager.isValidSmooth()) {
        cameraBack.position.y = scrollManager.hookes.contents.velocity[1] * 0.6;
      } else {
        cameraBack.position.y = scrollManager.scrollTop * -1;
      }
    };
  };
  let groupedEvents = [];
  const loadEvents = async () => {
    groupedEvents = await getEventDetailsFromDatabase();
    document.querySelector(".a-event-schedule").style.display = "flex";

    const weekdays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    groupedEvents.forEach((events, index) => {
      const dayIndex = weekdays[index];
      console.log(events);
      events.sort((a, b) => Number(a.date) - Number(b.date));
      events.forEach((event, index) => {
        const eventElem = document.getElementById(dayIndex + index);
        eventElem.style.display = "flex";

        eventElem.querySelector(".a-event__title").innerHTML =
          event["Event Title"];
        eventElem.querySelector(".a-event__details").innerHTML =
          "Hosted by:  " + event["Company"];
        if (event["Event Location"]) {
          eventElem.querySelector(".a-event__description").innerHTML =
            "Location:  " + event["Event Location"];
        } else {
          eventElem.querySelector(".a-event__description").style.display =
            "none";
        }
        if (event.time) {
          if (event.time === "TBD") {
            eventElem.querySelector(".a-event__time").style.display = "none";
          } else {
            eventElem.querySelector(".a-event__time").innerHTML =
              "Time:  " + event.time;
          }
        } else {
          eventElem.querySelector(".a-event__time").style.display = "none";
        }
        if (event["Event Link"]) {
          eventElem.querySelector("#link").href = event["Event Link"];
        } else {
          eventElem.querySelector(".a-event__link").style.display = "none";
        }
        if (event["Highlighted"]) {
          eventElem.classList.add("highlighted");
        }
      });
    });

    const allFilter = document.getElementById("allSelected");
    const mondayFilter = document.getElementById("mondaySelected");
    const tuesdayFilter = document.getElementById("tuesdaySelected");
    const wednesdayFilter = document.getElementById("wednesdaySelected");
    const thursdayFilter = document.getElementById("thursdaySelected");
    const fridayFilter = document.getElementById("fridaySelected");
    const saturdayFilter = document.getElementById("saturdaySelected");
    const sundayFilter = document.getElementById("sundaySelected");

    allFilter.addEventListener("click", () => {
      weekdays.forEach((day, index) => {
        document.getElementById(day + "title").style.display = "flex";
        document.getElementById(day + "events").style.display = "flex";
      });
    });
    mondayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Monday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
    tuesdayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Tuesday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
    wednesdayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Wednesday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
    thursdayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Thursday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
    fridayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Friday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
    saturdayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Saturday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
    sundayFilter.addEventListener("click", function () {
      weekdays.forEach((day, index) => {
        if (day !== "Sunday") {
          document.getElementById(day + "title").style.display = "none";
          document.getElementById(day + "events").style.display = "none";
        } else {
          document.getElementById(day + "title").style.display = "flex";
          document.getElementById(day + "events").style.display = "flex";
        }
      });
    });
  };
  const transitionOnload = () => {
    for (var i = 0; i < elemIntro.length; i++) {
      const elm = elemIntro[i];
      elm.classList.add("is-shown");
    }

    openRegister.addEventListener("click", function () {
      register.classList.add("is-shown");
    });

    registerScroll.addEventListener("click", function () {
      var register = document.querySelector("#registerToPoint");
      register.scrollIntoView({ behavior: "smooth", block: "start" });

      // hide register scroll button
      setTimeout(function () {
        registerScroll.classList.remove("is-shown");
      }, 400);
    });

    submitButton.addEventListener("click", function () {
      // submitting as a guest
      submitAttendee();
    });

    registerButton.addEventListener("click", function () {
      // submitting as a host

      submitEvent();
    });

    typeSelect.onchange = function () {
      console.log("Chainging");
      console.log(typeSelect.value);
      if (typeSelect.value == "Host") {
        eventDetails.classList.add("is-shown");
        submitButton.classList.add("is-hidden");
      } else {
        eventDetails.classList.remove("is-shown");
        submitButton.classList.remove("is-hidden");
      }
    };

    const submitAttendee = (guest = true) => {
      var goodToGo = true;
      // check name input
      if (nameInput.value == "") {
        nameInput.classList.add("is-error");
        goodToGo = false;
      } else {
        nameInput.classList.remove("is-error");
      }
      // check social input
      if (socialInput.value == "") {
        socialInput.classList.add("is-error");
        goodToGo = false;
      } else {
        socialInput.classList.remove("is-error");
      }
      // check email input
      if (emailInput.value == "") {
        emailInput.classList.add("is-error");
        goodToGo = false;
      } else {
        emailInput.classList.remove("is-error");
      }
      // check company input
      if (companyInput.value == "") {
        companyInput.classList.add("is-error");
        goodToGo = false;
      } else {
        companyInput.classList.remove("is-error");
      }
      // check title input
      if (titleInput.value == "") {
        titleInput.classList.add("is-error");
        goodToGo = false;
      } else {
        titleInput.classList.remove("is-error");
      }
      // check type select
      if (typeSelect.value == "") {
        typeSelect.classList.add("is-error");
        goodToGo = false;
      } else {
        typeSelect.classList.remove("is-error");
      }
      if (goodToGo) {
        // submit registration & clear
        if (guest) {
          successMessage.classList.add("is-shown");
        }

        const application = {
          name: nameInput.value,
          social: socialInput.value,
          email: emailInput.value,
          company: companyInput.value,
          title: titleInput.value,
          attendance: typeSelect.value,
        };

        registerToDatabase(application);

        resetFields();
      }
    };

    const submitEvent = () => {
      var goodToGo = true;
      // check name input
      if (nameInput.value == "") {
        nameInput.classList.add("is-error");
        goodToGo = false;
      } else {
        nameInput.classList.remove("is-error");
      }
      // check company input
      if (companyInput.value == "") {
        companyInput.classList.add("is-error");
        goodToGo = false;
      } else {
        companyInput.classList.remove("is-error");
      }
      // check email input
      if (emailInput.value == "") {
        emailInput.classList.add("is-error");
        goodToGo = false;
      } else {
        emailInput.classList.remove("is-error");
      }
      // check social input
      if (socialInput.value == "") {
        socialInput.classList.add("is-error");
        goodToGo = false;
      } else {
        socialInput.classList.remove("is-error");
      }
      // check event title input
      if (eventTitleInput.value == "") {
        eventTitleInput.classList.add("is-error");
        goodToGo = false;
      } else {
        eventTitleInput.classList.remove("is-error");
      }
      // check event date input
      if (eventDateInput.value == "") {
        eventDateInput.classList.add("is-error");
        goodToGo = false;
      } else {
        eventDateInput.classList.remove("is-error");
      }
      // check event location input
      if (eventLocationInput.value == "") {
        eventLocationInput.classList.add("is-error");
        goodToGo = false;
      } else {
        eventLocationInput.classList.remove("is-error");
      }
      // check event capacity select
      if (capacitySelect.value == "") {
        capacitySelect.classList.add("is-error");
        goodToGo = false;
      } else {
        capacitySelect.classList.remove("is-error");
      }
      // check event description input
      if (eventDescriptionInput.value == "") {
        eventDescriptionInput.classList.add("is-error");
        goodToGo = false;
      } else {
        eventDescriptionInput.classList.remove("is-error");
      }

      if (goodToGo) {
        // submit registration & clear
        eventSuccessMessage.classList.add("is-shown");

        const event = {
          name: nameInput.value,
          company: companyInput.value,
          email: emailInput.value,
          social: socialInput.value,
          eventTitle: eventTitleInput.value,
          eventDate: eventDateInput.value,
          eventLocation: eventLocationInput.value,
          eventCapacity: capacitySelect.value,
          eventLink: eventLinkInput.value ?? "",
          eventDescription: eventDescriptionInput.value,
        };

        registerEventDetailsToDatabase(event);
        submitAttendee(false);

        resetFields();
      }
    };

    const resetFields = () => {
      nameInput.value = "";
      socialInput.value = "";
      emailInput.value = "";
      companyInput.value = "";
      titleInput.value = "";
      typeSelect.value = "";

      eventTitleInput.value = "";
      eventDateInput.value = "";
      eventLocationInput.value = "";
      capacitySelect.value = "";
      eventLinkInput.value = "";
      eventDescriptionInput.value = "";
    };
  };

  const init = async () => {
    loadEvents();

    renderer.setSize(document.body.clientWidth, window.innerHeight);
    renderer.setClearColor(0x111111, 1.0);
    cameraBack.position.z = 800;

    scene.add(postEffect.obj);
    sceneBack.add(ground.obj);

    buildingObject.loadTexture(() => {
      sceneBack.add(buildingObject.obj);
    });

    titleObject.loadTexture(() => {
      sceneBack.add(titleObject.obj);
      // sceneBack.add(skyOctahedron.obj);
      // sceneBack.add(skyOctahedronShell.obj);
      for (var i = 0; i < debris.length; i++) {
        sceneBack.add(debris[i].obj);
      }
      transitionOnload();
    });

    await Promise.all([
      texLoader.loadAsync("../img/index/tex_title.png"),
      texLoader.loadAsync("../img/sketch/easy_glitch/noise.png"),
    ]).then((response) => {
      textures = response;
    });

    if (textures) {
      textures[0].wrapS = THREE.RepeatWrapping;
      textures[0].wrapT = THREE.RepeatWrapping;
      textures[1].wrapS = THREE.RepeatWrapping;
      textures[1].wrapT = THREE.RepeatWrapping;
      textures[1].minFilter = THREE.NearestFilter;
      textures[1].magFilter = THREE.NearestFilter;

      typo.start(textures[0], textures[1]);

      scene.add(typo);
    }

    clock.start();

    on();
    resizeWindow();
    renderLoop();
    scrollManager.start();
  };
  init();
}
