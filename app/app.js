const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key', // Use a strong secret key here
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set 'secure' to true if you're using https
}));

// Dummy database
let users = []; // przechowywanie użytkowników
let products = [
  { id: 1, name: 'Towar 1', description: 'Opis towaru 1', price: 100 },
  { id: 2, name: 'Towar 2', description: 'Opis towaru 2', price: 200 },
  { id: 3, name: 'Towar 3', description: 'Opis towaru 3', price: 150 }
];
let admin = { username: 'admin', password: 'admin' };

// Initialize user cart in session if not present
function initializeCart(req) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
}

// Routes

// Home page
app.get('/', (req, res) => {
  initializeCart(req); // Initialize cart on each request
  res.render('index', { session: req.session, products: products, cart: req.session.cart });
});

// Search products
app.post('/search', (req, res) => {
  const query = req.body.query.toLowerCase();
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
  );
  res.render('index', { products: filteredProducts, cart: req.session.cart });
});

// Add to cart
app.post('/add-to-cart', (req, res) => {
  const productId = parseInt(req.body.productId);
  const product = products.find(p => p.id === productId);
  if (product) {
    req.session.cart.push(product);
  }
  res.redirect('/');
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user; // Store user data in session
    initializeCart(req); // Initialize cart for the logged-in user
    res.redirect('/');
  } else {
    res.send('Błędne dane logowania!');
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');
  });
});

// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  users.push({ username, password });
  res.redirect('/login');
});

// Admin panel
app.get('/admin', (req, res) => {
  if (req.session.user && req.session.user.username === admin.username) {
    res.render('admin', { users: users, products: products, cart: req.session.cart });
  } else {
    res.send('Brak dostępu');
  }
});

// Add product (Admin)
app.post('/admin/add-product', (req, res) => {
  if (req.session.user && req.session.user.username === admin.username) {
    const { name, description, price } = req.body;
    const newProduct = { id: products.length + 1, name, description, price: parseFloat(price) };
    products.push(newProduct);
    res.redirect('/admin');
  } else {
    res.send('Brak dostępu');
  }
});

// Delete product (Admin)
app.post('/admin/delete-product', (req, res) => {
  if (req.session.user && req.session.user.username === admin.username) {
    const productId = parseInt(req.body.productId);
    products = products.filter(p => p.id !== productId);
    res.redirect('/admin');
  } else {
    res.send('Brak dostępu');
  }
});

// Orders page (Admin)
app.get('/orders', (req, res) => {
  if (req.session.user && req.session.user.username === admin.username) {
    res.render('orders', { orders: req.session.cart });
  } else {
    res.send('Brak dostępu');
  }
});

// Start server
app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
