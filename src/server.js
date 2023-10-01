import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { extname } from 'path';

import authMiddleware from './middlewares/auth.middleware.js';
import UserService from './services/user.service.js';
import ProductService from './services/product.service.js';

const app = express();
const port = 3333;
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const newFilename = crypto.randomBytes(32).toString('hex');
    const filenameExtension = extname(file.originalname);
    cb(null, `${newFilename}${filenameExtension}`);
  }
});
const uploadMiddleware = multer({ storage: storageConfig });

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('API: ImagineShop');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userService = new UserService();
  try {
    const token = await userService.login(email, password);
    return res.status(200).json({ access_token: token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get('/products', async (req, res) => {
  const productService = new ProductService();
  const products = await productService.findAll();
  return res.status(200).json(products);
});

app.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const productService = new ProductService();
  const product = await productService.findById(id);
  return res.status(200).json(product);
});

app.post('/products', authMiddleware, uploadMiddleware.single('image'), async (req, res) => {
  const { name, description, price, summary, stock } = req.body;
  const productService = new ProductService();
  const product = {
    name,
    description,
    price,
    summary,
    stock,
    fileName: req.file.filename
  };
  await productService.add(product);
  return res.status(201).json({ message: 'success' });
});

app.post('/products/sell', authMiddleware, async (req, res) => {
  const { productIds } = req.body;
  const productService = new ProductService();
  await productService.sell(productIds);
  return res.status(201).json({ message: 'success' });
});

// C - CREATE
app.post('/users', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  const userService = new UserService();
  await userService.add(name, email, password);
  return res.status(201).json({ message: 'success' });
});

// R - READ
app.get('/users', authMiddleware, async (req, res) => {
  const userService = new UserService();
  const users = await userService.findAll();
  return res.status(200).json(users);
});

app.get('/users/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userService = new UserService();
  const user = await userService.findById(id);
  return res.status(200).json(user);
});

// U - UPDATE
app.put('/users/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { name, email, password } = req.body;
  const user = { name, email, password };
  const userService = new UserService();
  try {
    await userService.update(id, user);
    return res.status(200).json({ message: 'success' });
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
});

// D - DELETE
app.delete('/users/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userService = new UserService();
  try {
    await userService.delete(id);
    return res.status(200).json({ message: 'success' });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});