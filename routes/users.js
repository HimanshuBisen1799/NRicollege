var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

async function connectToDatabase() {
  try {
    // Your MongoDB connection code here
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToDatabase();

var userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        // Regular expression to validate email format
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
    required: [true, 'Contact Number is required.'],
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
  posts: [
    {
      type: {
        type: String,
        required: [true, 'Type of room is required.'],
      },
      city: {
        type: String,
        required: [true, 'City name is required.'],
      },
      state: {
        type: String,
        required: [true, 'State is required.']
      },
      location: {
        type: String,
        required: [true, 'Location is required.']
      },
      pincode: {
        type: Number,
        required: [true, 'Pincode is required.']
      },
      area: {
        type: String,
        required: [true, 'Area Street is required.'],
      },
      description: {
        type: String,
        required: [true, 'Description is required.'],
      },
      price: {
        type: Number,
        required: [true, 'Price is required.'],
      },
      number: {
        type: Number,
        required: [true, 'Contact number is required.'],
      },
      images: {
        type: Array,
        required: [true, 'Images are required.'],
        default: []
      }
    },
    { timestamps: true }
  ],
  savePost: {
    type: Array,
    default: []
  },
}, { timestamps: true });

userSchema.methods.getjwttoken = function () {
  return jwt.sign({ id: this._id }, "JWT_SECRET", { expiresIn: "1h" });
}

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('user', userSchema);
