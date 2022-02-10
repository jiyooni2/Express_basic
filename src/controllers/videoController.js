import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate(["owner", "comments"]);

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  console.log(video);
  return res.render("watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  return res.render("edit", { pageTitle: `Edit: ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;

  const { id } = req.params;
  const { title, description, hashtags } = req.body;
  const video = await Video.findOne({ _id: id });
  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(_id)) {
    req.flash("error", "You are not the owner of the video");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });

  req.flash("success", "Changes saved");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;

  const { title, description, hashtags } = req.body;
  try {
    const newVideo = await Video.create({
      owner: _id,
      title,
      description,
      fileUrl: video[0].path,
      thumbUrl: thumb[0].path,
      hashtags: Video.formatHashtags(hashtags),
    });

    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();

    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const {
    user: { _id },
  } = req.session;

  const { id } = req.params;

  const video = await Video.findById(id);

  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: `${keyword}`,
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.find({ _id: id });

  if (!video) {
    return res.sendStatus(404);
  }

  video.meta.views++;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const { id } = req.params;
  if (!req.session.user) {
    return res.sendStatus(404);
  }

  const video = await Video.findOne({ _id: id });
  const user = await User.findOne({ _id: req.session.user._id });

  if (!video || !user) {
    return res.sendStatus(404);
  }

  const comment = await Comment.create({
    text: req.body.text,
    owner: req.session.user._id,
    video: id,
  });

  video.comments.push(comment._id);
  await video.save();

  user.comments.push(comment._id);
  await user.save();

  //Created
  return res.status(201).json({ newCommentId: comment._id });
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  if (!req.session.user) {
    return res.sendStatus(404);
  }

  //find는 여러개를 찾아서 array로 return, true/false check 시 주의하자!!
  const comment = await Comment.findOne({ _id: id });
  if (!comment) {
    return res.sendStatus(404);
  }

  if (String(comment.owner) !== String(req.session.user._id)) {
    return res.sendStatus(404);
  }

  await Comment.findByIdAndDelete(id);
  return res.sendStatus(200);
};
