import express from "express";
import {addToCart, removeAllFromCart, updateQuantity, getCartProducts} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/",protectRoute,getCartProducts)
router.post("/",protectRoute,addToCart);
router.delete("/",protectRoute,removeAllFromCart); //removeAllFromCart will remove a particular item having more than or equal to 1 quantity
router.put("/:id",protectRoute,updateQuantity);


export default router;