import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import {Product} from "./product.model.js"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be atleast 8 character long"],
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product,
        },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

// pre-save hook to hash password before saving to database
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next;

    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);
        next()
    } catch(error) {
        next(error)
    }
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(this.password,password);
}

const User = mongoose.model("User", userSchema); 

export default User;