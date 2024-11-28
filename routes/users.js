var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var jwt = require('jsonwebtoken');  // Ensure jwt is required for token generation

async function connectToDatabase() {
  try {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToDatabase();

var postSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Type of room is required.'],
    enum: ['Single Room', 'Flat', 'Commercial', 'Apartment']
  },
  city: {
    type: String,
    required: [true, 'City name is required.'],
    enum: ['Bhopal', 'Jabalpur', 'Indore', 'Sagar']
  },
  area: {
    type: String,
    required: [true, 'Area is required.'],
  },
  description: {
    type: String,
    required: [true, 'Description is required.'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required.'],
    min: 0
  },
  number: {
    type: Number,
    required: [true, 'Contact number is required.'],
  },
  images: {
    type: [String],  // Array to store paths or URLs of uploaded images
    required: [true, 'Images are required.'],
    validate: {
      validator: function (arr) {
        return arr.length > 0;
      },
      message: 'At least one image is required.'
    }
  }
}, { timestamps: true });

var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: 'Invalid email format.',
    },
  },
  username: {
    type: String,
    required: [true, 'Username is required.'],
    minlength: 3,
    maxlength: 30,
    unique: true
  },
  password: {
    type: String,
    minlength: [4, 'Password must be at least 4 characters long.'],
  },
  number: {
    type: Number,
    required: [true, 'Contact number is required.'],
  },
  city: {
    type: String,
    default: ""
  },
  gender: {
    type: String,
    default: ""
  },
  profileimage: {
    type: String,
    default: ""
  },
  posts: [postSchema],  // Nested subdocument for posts
  savePost: {
    type: Array,
    default: []
  }
}, { timestamps: true });

userSchema.methods.getjwttoken = function () {
  return jwt.sign({ id: this._id }, "JWT_SECRET", { expiresIn: "1h" });
}

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
