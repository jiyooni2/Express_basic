import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
  res.render("join", { pageTitle: "Join" });
};
export const postJoin = async (req, res) => {
  const { name, email, username, password, password2, location } = req.body;
  const exists = await User.findOne({ $or: [{ username }, { email }] });

  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: "Password Confirmation does not match",
    });
  }
  if (exists) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: "This username/email is already taken.",
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: error._message,
    });
  }
};

export const postLogin = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle: "login",
      errorMessage: "An account with this username doesn't exist",
    });
  }

  if (user.socialOnly === true) {
    return res.status(400).render("login", {
      pageTitle: "login",
      errorMessage: "Login with Github!",
    });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).render("login", {
      pageTitle: "login",
      errorMessage: "Wrong Password",
    });
  }

  req.session.loggedIn = true;
  req.session.user = user;

  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  //encoding params
  const params = new URLSearchParams(config).toString();
  const url = `https://github.com/login/oauth/authorize?${params}`;
  return res.redirect(url);
};

export const finishGithubLogin = async (req, res) => {
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const url = `https://github.com/login/oauth/access_token?${params}`;

  const tokenRequest = await (
    await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    })
  ).json();

  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    //public data
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    //private data (if email is private data)
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );

    //github의 email과 같은 email이 이미 유저 DB에 존재한다면..?
    if (!emailObj) {
      return res.redirect("/login");
    }

    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      //해당 email로 없으니까, create an account
      user = await User.create({
        //if no password, have to login with social
        name: userData.name,
        avatarUrl: userData.avatar_url,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
      //verified email, get login
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const getEdit = (req, res) => {
  return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl },
    },
    body: { name, email, username, location },
    file,
  } = req;

  if (
    req.session.user.username !== username &&
    (await User.findOne({ username }))
  ) {
    return console.log("username duplicated");
  }
  if (req.session.user.email !== email && (await User.findOne({ email }))) {
    return console.log("email duplicated");
  }

  const isHeroku = process.env.NODE_ENV === "production";
  const updatedUser = await User.findByIdAndUpdate(
    { _id },
    {
      avatarUrl: file ? (isHeroku ? file.location : file.path) : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );

  req.session.user = updatedUser;

  req.flash("info", "Changes saved");

  return res.redirect("/");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly) {
    req.flash("error", "Can't change password");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id, password },
    },
    body: { oldPassword, newPassword, newPassword1 },
  } = req;

  if (newPassword !== newPassword1) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The password does not match",
    });
  }

  const match = await bcrypt.compare(oldPassword, password);

  if (!match) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The current password is incorrect",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(_id, {
    password: await bcrypt.hash(newPassword, 5),
  });

  //or using pre db middleware
  /*
  const user = await User.findById(_id);
  user.password = newPassword;
  await user.save();
*/
  req.flash("info", "Password updated");

  req.session.user = updatedUser;

  return res.redirect("/");
};

export const remove = (req, res) => res.send("Remove User");

export const getLogin = (req, res) => {
  res.render("login", { pageTitle: "Login" });
};

export const logout = (req, res) => {
  req.flash("info", "Bye Bye");
  req.session.user = null;
  req.session.loggedIn = false;
  //req.session.destroy();

  return res.redirect("/");
};

export const see = async (req, res) => {
  //session말고 params에서 가져와야함, public page
  const { id } = req.params;

  const user = await User.findById(id).populate({
    path: "videos",
    populate: { path: "owner", model: "User" },
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not Found" });
  }

  return res.render("users/profile", {
    pageTitle: user.name,
    user,
  });
};
