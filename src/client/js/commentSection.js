const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const videoComments = document.querySelector(".video__comments");

const addComment = (text, commentId, userId, avatarUrl) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = commentId;
  newComment.className = "video__comment";

  const profile = document.createElement("span");
  const a = document.createElement("a");
  const img = document.createElement("img");
  profile.id = "profile_img";
  a.setAttribute("href", `/users/${userId}`);
  img.setAttribute("src", `${avatarUrl}`);
  img.setAttribute("width", "30");
  img.setAttribute("height", "30");
  img.setAttribute("crossorigin", "");

  a.appendChild(img);
  profile.appendChild(a);

  const span = document.createElement("span");
  span.innerText = ` ${text}`;
  const span2 = document.createElement("span");
  span2.id = "video__delete-comment";
  span2.innerText = "❌";
  newComment.appendChild(profile);
  newComment.appendChild(span);

  newComment.appendChild(span2);
  //place at the top
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("#comment");
  const text = textarea.value;
  const { id } = videoContainer.dataset;

  if (text === "") {
    return;
  }

  const response = await fetch(`/api/videos/${id}/comment`, {
    method: "POST",
    body: JSON.stringify({ text: text }),
    headers: { "Content-Type": "application/json" },
  });

  //response에 json data 들어있음
  if (response.status === 201) {
    textarea.value = "";
    //JSON to js object
    const { id, avatarUrl, newCommentId } = await response.json();
    addComment(text, newCommentId, id, avatarUrl);
  }
};

const handleRemove = async (event) => {
  //commentID
  const { id } = event.target.parentNode.dataset;
  if (event.target.id === "video__delete-comment") {
    const response = await fetch(`/api/comments/${id}`, {
      method: "DELETE",
    });

    if (response.status === 200) {
      event.target.parentNode.remove();
    }
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}

videoComments.addEventListener("click", handleRemove);
