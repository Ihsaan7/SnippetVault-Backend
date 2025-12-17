import jwt from "jsonwebtoken";

const genAccessToken = (userID) => {
  return jwt.sign({ _id: userID }, process.env.ACCESS_TOKEN, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

const genRefreshToken = (userID) => {
  return jwt.sign({ _id: userID }, process.env.REFRESH_TOKEN, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export { genAccessToken, genRefreshToken };
