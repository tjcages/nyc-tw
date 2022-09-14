import data from "../../../data.json"

const THREE = require("three");
const { debounce } = require("@ykob/js-util");

const SmoothScrollManager =
  require("../../smooth_scroll_manager/SmoothScrollManager").default;
const TitleObject = require("./TitleObject").default;
const LogoObject = require("./LogoObject").default;
const PostEffect = require("../../index/PostEffect").default;
const Typo = require("../../index/Typo").default;

export default function (props) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const company = urlParams.get('comp')
  const companyData = data.hosts.find(host => host.company === company)
  const scrollManager = new SmoothScrollManager();

  const header = document.getElementById("header");
  header.innerHTML = companyData.company;
  const description = document.getElementById("description");
  description.innerHTML = companyData.description;

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
  const titleObject = new TitleObject();
  const logoObject = new LogoObject(companyData.logo);
  const postEffect = new PostEffect(renderBack.texture);
  const typo = new Typo();
  let textures;

  const elemIntro = document.getElementsByClassName("js-transition-intro");

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
    logoObject.render(time);

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
  const transitionOnload = () => {
    for (var i = 0; i < elemIntro.length; i++) {
      const elm = elemIntro[i];
      elm.classList.add("is-shown");
    }
  };

  const init = async () => {
    renderer.setSize(document.body.clientWidth, window.innerHeight);
    renderer.setClearColor(0x111111, 1.0);
    cameraBack.position.z = 800;

    scene.add(postEffect.obj);

    logoObject.loadTexture(() => {
      sceneBack.add(logoObject.obj);
    });

    titleObject.loadTexture(() => {
      sceneBack.add(titleObject.obj);
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
