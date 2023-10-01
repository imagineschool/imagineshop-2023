import jwt from 'jsonwebtoken';
import UserService from '../services/user.service.js';

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization ? authorization.split(" ")[1] : undefined;
  if(!token) return res.status(401).json({ message: 'Falha no login'});
  const secretKey = process.env.SECRET_KEY;
  jwt.verify(token, secretKey, { ignoreExpiration: false }, async (err, decodedToken) => {
    if(err) return res.status(401).json({ message: 'Falha no login'});
    const isValidToken = decodedToken && decodedToken.user;
    if(!isValidToken) return res.status(401).json({ message: 'Falha no login'});
    const userService = new UserService();
    const user = await userService.findByEmail(decodedToken.user.email);
    if(!user) return res.status(401).json({ message: 'Falha no login'});
    return next();
  });
};

export default authMiddleware;