export const localsMiddleware = (req, res, next) => {
  //return undefined/false or true
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.siteName = "Wetube";
  res.locals.loggedInUser = req.session.user;
  next();
};
