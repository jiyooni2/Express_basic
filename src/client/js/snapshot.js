import VideoSnapshot from "video-snapshot";

const thumb = document.getElementById("thumb");
//video input
const video = document.getElementById("video");
const videoSrc = document.querySelector("#video-source");
const videoTag = document.querySelector("#video-tag");
const inputTag = document.querySelector("#input-tag");

const onChange = async (event) => {
  if (!event.target.files[0]) return;

  const snapshot = new VideoSnapshot(event.target.files[0]);
  const previewSrc = await snapshot.takeSnapshot();

  const a = document.createElement("a");
  a.download = "default thumbnail";
  a.href = previewSrc;
  document.body.appendChild(a);
  a.click();

  console.log("Complete");
};

video.addEventListener("change", onChange);
