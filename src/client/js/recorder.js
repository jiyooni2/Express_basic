const startBtn = document.getElementById("startBtn");
const video = document.querySelector("#preview");

let stream;
let recorder;
let videoFile;

//video URL을 연결하는 a링크를 안보이게 생성 후 클릭 하는 형식으로 동작
const handleDownload = () => {
  const a = document.createElement("a");
  a.href = videoFile;
  //a에 download속성 추가하면, 클릭시 다운로드
  a.download = "MyRecording.webm";
  document.body.appendChild(a);
  a.click();
};

const handleStop = () => {
  startBtn.innerText = "Download Recording";
  startBtn.removeEventListener("click", handleStop);
  startBtn.addEventListener("click", handleDownload);

  recorder.stop();
};

const handleStart = () => {
  startBtn.innerText = "Stop Recording";
  startBtn.removeEventListener("click", handleStart);
  startBtn.addEventListener("click", handleStop);

  recorder = new MediaRecorder(stream);

  //register event on the MediaRecorder element(recorder)
  recorder.ondataavailable = (event) => {
    videoFile = URL.createObjectURL(event.data);
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();
  };

  recorder.start();
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: 200, height: 100 },
  });
  video.srcObject = stream;
  video.play();
};

init();

startBtn.addEventListener("click", handleStart);
