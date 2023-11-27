var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/rent");

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
    // required: [true,'Password is required.'],
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
      post:{
        type: Array,
        default: []
      },
      type: {
        type: String,
        default: "",
        required: [true, 'Type of room is required.'],
      },
      city: {
        type: String,
        default: "",
        required: [true, 'City name is required.'],
      },
      area: {
        required: [true, 'Area Street is required.'],
        type: String,
        default: ""
      },
      description: {
        required: [true, 'Description is required.'],
        type: String,
        default: ""
      },
      price: {
        required: [true, 'Price is required.'],
        type: Number,
        default: ""
      },
      number: {
        required: [true, 'Contact number is required.'],
        type: Number,
        default: " "
      },
      images: {
        required: [true, 'Images is required.'],
        type: Array,
        default: []
      }
    }, { timestamps: true }
  ],
  savePost: {
    type: Array,
    default: []
  },
}, { timestamps: true });


userSchema.methods.getjwttoken = function () {
  return jwt.sign({ id: this._id },"JWT_SECRET", { expiresIn: "1h" });
}

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('user', userSchema);