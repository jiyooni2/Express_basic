import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const actionBtn = document.getElementById("actionBtn");
const video = document.querySelector("#preview");

let stream;
let recorder;
let videoFile;

const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumb: "thumbnail.jpg",
};

const downloadFile = (fileUrl, fileName) => {
  const a = document.createElement("a");
  a.href = fileUrl;
  //a에 download속성 추가하면, 클릭시 다운로드
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};

//video URL을 연결하는 a링크를 안보이게 생성 후 클릭 하는 형식으로 동작
const handleDownload = async () => {
  actionBtn.removeEventListener("click", handleDownload);
  actionBtn.innerText = "Transcoding...";
  actionBtn.disabled = true;

  //user uses non-JS code
  //ffmpeg SW를 쓰는 것, 불러올때까지 대기
  const ffmpeg = createFFmpeg({
    corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
    log: true,
  });
  await ffmpeg.load();
  //ffmpeg라는 가상 컴퓨터가 있다고 생각
  ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile));

  //convert recording.webm to output.mp4
  //가상 컴퓨터의 cmd라고 생각
  //-r 60 : 초당 60프레임으로 인코딩, 빠른 영상 인코딩
  await ffmpeg.run("-i", files.input, "-r", "60", files.output);

  //이동한 시간의 스크린샷 1장
  await ffmpeg.run(
    "-i",
    files.input,
    "-ss",
    "00:00:00",
    "-frames:v",
    "1",
    files.thumb
  );

  const mp4File = ffmpeg.FS("readFile", files.output);
  const thumbFile = ffmpeg.FS("readFile", files.thumb);

  //mp4File.buffer : access to raw binary file(blob)
  const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
  const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

  const mp4Url = URL.createObjectURL(mp4Blob);
  const thumbUrl = URL.createObjectURL(thumbBlob);

  downloadFile(mp4Url, "MyRecording.mp4");
  downloadFile(thumbUrl, "Thumbnail.jpg");

  ffmpeg.FS("unlink", files.output);
  ffmpeg.FS("unlink", files.thumb);
  ffmpeg.FS("unlink", "recording.webm");

  URL.revokeObjectURL(thumbUrl);
  URL.revokeObjectURL(mp4Url);
  URL.revokeObjectURL(videoFile);

  actionBtn.addEventListener("click", handleStart);
  actionBtn.innerText = "Start Recording";
  actionBtn.disabled = false;
};

const handleStop = () => {
  actionBtn.innerText = "Download Recording";
  actionBtn.removeEventListener("click", handleStop);
  actionBtn.addEventListener("click", handleDownload);

  recorder.stop();
};

const handleStart = () => {
  actionBtn.innerText = "Stop Recording";
  actionBtn.removeEventListener("click", handleStart);
  actionBtn.addEventListener("click", handleStop);

  recorder = new MediaRecorder(stream);

  //register event on the MediaRecorder element(recorder)
  //if recording ends, ondataavailabe event occurs
  //blob file create
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
    video: { width: 1024, height: 576 },
  });
  video.srcObject = stream;
  video.play();
};

init();

actionBtn.addEventListener("click", handleStart);
