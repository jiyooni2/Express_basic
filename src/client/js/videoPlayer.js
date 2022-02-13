const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");

const muteBtnIcon = muteBtn.querySelector("i");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const volumeRange = document.getElementById("volume");
const timeline = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");

const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let volumeValue = 0.5;
let controlsMovementTimeout;
let controlsTimeout;

const handlePlayClick = (e) => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
  playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
};

const handleMuteClick = () => {
  if (video.muted) {
    video.muted = false;
  } else {
    video.muted = true;
  }
  muteBtnIcon.classList = video.muted
    ? "fas fa-volume-mute"
    : "fas fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
  const {
    target: { value },
  } = event;

  volumeValue = value;
  video.volume = value;

  if (video.muted) {
    video.muted = false;
    muteBtnIcon.classList = "fas fa-volume-mute";
  }

  if (Number(value) === 0) {
    muteBtn.dispatchEvent(new Event("click"));
  }
};

const getTime = (seconds) => {
  return new Date(seconds * 1000).toISOString().substring(14, 19);
};

const handleTimeUpdate = (event) => {
  const current = getTime(Math.floor(event.target.currentTime));

  timeline.value = Math.floor(video.currentTime);
  if (currentTime.innerText === current) return;

  currentTime.innerText = current;
};

const handleLoadedMetaData = (event) => {
  totalTime.innerText = getTime(Math.floor(video.duration));
  timeline.max = Math.floor(video.duration);
};

const handleTimelineChange = (event) => {
  const {
    target: { value },
  } = event;

  //getter and setter both available
  video.currentTime = value;
};

const handleFullScreen = () => {
  const fullscreen = document.fullscreenElement;
  if (fullscreen) {
    document.exitFullscreen();
    video.classList.remove("full");
    fullScreenIcon.classList = "fas fa-expand";
  } else {
    videoContainer.requestFullscreen();
    video.classList.add("full");
    fullScreenIcon.classList = "fas fa-compress";
  }
};

//handle exit full screen using esc key
const handleExitFullscreen = () => {
  const fullscreen = document.fullscreenElement;
  if (fullscreen) {
    video.classList.remove("full");
    fullScreenIcon.classList = "fas fa-expand";
  }
};

const hideControls = () => videoControls.classList.remove("showing");
const showControls = () => videoControls.classList.add("showing");

const handleMouseMove = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }

  if (controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }

  showControls();
  controlsMovementTimeout = setTimeout(hideControls, 3000);
};

const handleMouseLeave = () => {
  controlsTimeout = setTimeout(() => {
    hideControls();
  }, 3000);
};

const handleEnded = () => {
  playBtnIcon.classList = "fas fa-play";

  const { id } = videoContainer.dataset;
  //id가 필요, HTML(pug)에서 정보를 남겨야 함, data property 사용
  fetch(`/api/videos/${id}/view`, {
    method: "POST",
  });
};

//input : 변하면서 동시에, change : 변한 후에 한번 차이 주의
volumeRange.addEventListener("input", handleVolumeChange);
//metaData가 업데이트 된 뒤에야 비디오의 전체 시간 알 수 있겠지
video.addEventListener("canplay", handleLoadedMetaData);
video.addEventListener("timeupdate", handleTimeUpdate);
playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMuteClick);
timeline.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullScreen);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
video.addEventListener("ended", handleEnded);
document.addEventListener("fullscreenchange", handleExitFullscreen);

if (video.readyState == 4) {
  handleLoadedMetaData();
}
