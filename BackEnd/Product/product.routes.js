import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPopularProducts
} from "./product.controller.js";
import { fileUpload, filterObject } from "../utils/multer.js";

const router = Router();

/////////////////(CreateProduct)\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
router.post(
  "/",
  fileUpload(filterObject.image).single("image"),
  createProduct
);

/////////////////(GetProducts)\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
router.get("/", getProducts);
////////////////(GetPopularProducts)\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
router.get("/popular", getPopularProducts);
/////////////////(GetSingleProduct)\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
router.get("/:productId", getProductById);

/////////////////(UpdateProduct)\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
router.patch(
  "/:productId",
  fileUpload(filterObject.image).single("image"),
  updateProduct
);

/////////////////(DeleteProduct)\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
router.delete("/:productId", deleteProduct);

export default router;
