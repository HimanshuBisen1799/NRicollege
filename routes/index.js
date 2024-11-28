const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const passport = require('passport');
const userModel = require('./users.js');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const localStrategy = require('passport-local');
const cloudinary = require('cloudinary').v2;
const sendtoken = require('../utils/SendToken.js');

// Configure Passport.js
passport.use(new localStrategy(userModel.authenticate()));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.YOUR_CLOUD_NAME,
  api_key: process.env.YOUR_API_KEY,
  api_secret: process.env.YOUR_API_SECRET
});

// Multer configuration for uploading images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/postUploads');
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(10, function (err, buff) {
      const fn = buff.toString('hex') + path.extname(file.originalname);
      cb(null, fn);
    });
  }
});

function fileFilter(req, file, cb) {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('File format should be PNG, JPG, or JPEG'), false);
  }
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

// POST route for uploading images to Cloudinary
router.post('/uploadpost', isLoggedIn, upload.array('images', 4), async function (req, res) {
  const { type, city, state, location, pincode, area, description, number, price } = req.body;
  
  try {
    const uploadedImages = [];
  
    const promises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, { resource_type: 'auto' }, (error, result) => {
          if (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return reject(error);
          }
          uploadedImages.push(result.secure_url);
          resolve();
        });
      });
    });
  
    await Promise.all(promises);
  
    const user = await userModel.findById(req.user._id);
  
    const newPost = {
      type,
      city,
      state,
      location,
      pincode,
      area,
      description,
      number,
      price,
      images: uploadedImages
    };
  
    user.posts.push(newPost);
    await user.save();
  
    res.status(200).json({ message: 'Post uploaded successfully', post: newPost });
  } catch (error) {
    console.error('Error uploading post:', error);
    res.status(500).send('Error uploading post');
  }
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index1');
});
router.get('/signin', function (req, res, next) {
  res.render('signin');
});
// Register user route
router.post('/register', function (req, res, next) {
  var user = new userModel({
    email: req.body.email,
    username: req.body.username,
    number: req.body.number,
  });
  
  userModel.register(user, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/index');
      });
    })
    .catch(function (e) {
      res.send(e);
    });
});

// Login route
router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/index',
  failureRedirect: '/'
}), function (req, res, next) {
  sendtoken(req.user, 200, res);
});

// Logout route
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Get home page of application
router.get('/index', isLoggedIn, async function (req, res, next) {
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
  res.render('index', { loggedInUser });
});

// Get list ad page
router.get('/listroom', isLoggedIn, async function (req, res, next) {
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
  res.render('listroom', { loggedInUser });
});


// Save ad form
router.post('/uploadpost', isLoggedIn, upload.array('images', 4), async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });

    if (!loggedInUser) {
      return res.status(404).send('User not found');
    }

    const images = req.files.map(file => file.filename);

    const newPost = {
      type: req.body.type,
      city: req.body.city,
      area: req.body.area,
      description: req.body.description,
      number: req.body.number,
      price: req.body.price,
      images: images,
    };

    loggedInUser.posts.push(newPost);
    await loggedInUser.save();

    res.render('profile', { loggedInUser });
  } catch (error) {
    console.error('Error uploading post:', error);
    res.status(500).send('An error occurred while uploading the post.');
  }
});

// Delete ad
router.get('/delete/:postId', isLoggedIn, async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
    if (!loggedInUser) {
      return res.status(404).send('User not found');
    }
    const postIdToDelete = req.params.postId;

    // Find the index of the post in the user's posts array
    const postIndex = loggedInUser.posts.findIndex(post => post._id.toString() === postIdToDelete);
    if (postIndex === -1) {
      return res.status(404).send('Post not found');
    }
    // Remove the post from the array
    loggedInUser.posts.splice(postIndex, 1);
    await loggedInUser.save();
    res.render('profile', { loggedInUser });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).send('An error occurred while deleting the post.');
  }
});

// Profile page for myad and saved add
router.get('/profile', isLoggedIn, async function (req, res, next) {
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
  res.render('profile', { loggedInUser });
});

router.get('/findroom', isLoggedIn, async function (req, res, next) {
  const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
  const allUsers = await userModel.find();
  const allPosts = await userModel.find({}, 'username posts');

  res.render('findroom', { loggedInUser, allUsers, allPosts });
});

router.get('/card/:postId', async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });

    const postId = req.params.postId;
    const user = await userModel.findOne({ 'posts._id': postId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = user.posts.find((p) => p._id.toString() === postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.render('card', { post, loggedInUser });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;