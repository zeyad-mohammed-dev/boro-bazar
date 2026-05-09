import Review from './review.schema.js';
import CustomError from '../utils/customError.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Product from '../Product/product.schema.js';


const updateProductRating = async (productId) => {

  const reviews = await Review.find({ productId });

  const numReviews = reviews.length;

  const rating =
    numReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating,
    numReviews,
  });
};
////////////////////////////
// Create Review
////////////////////////////
export const createReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  if (!rating || !comment || !productId) {
    return next(
      new CustomError(
        'All fields are required (rating, comment, productId)',
        400
      )
    );
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new CustomError('Invalid product ID', 400));
  }

  const existingReview = await Review.findOne({
    reviewer: req.user._id,
    productId,
  });

  if (existingReview) {
    return next(new CustomError('You have already reviewed this product', 400));
  }

  const review = await Review.create({
    rating,
    comment,
    reviewer: req.user._id,
    productId,
  });

  if (review) {
    const product = await Product.findById(productId);
    if (product) {
      product.reviews.push(review._id);
      await product.save();
    }

    await updateProductRating(productId);
  }
  res.status(201).json({
    success: true,
    data: review,
  });
});

////////////////////////////
// Get Reviews with Pagination
////////////////////////////
export const getReviews = asyncHandler(async (req, res, next) => {
  const limit = 10;
  const { page = 1, productId } = req.query;

  if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new CustomError('Invalid product ID', 400));
  }

  const filter = {};
  if (productId) filter.productId = productId;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('reviewer', 'name email'),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

////////////////////////////
// Update Review
////////////////////////////
export const updateReview = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.reviewId)) {
    return next(new CustomError('Invalid review ID', 400));
  }

  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return next(new CustomError('Review not found!', 404));
  }

  if (review.reviewer.toString() !== req.user._id.toString()) {
    return next(new CustomError('You are not the owner of this review', 403));
  }

  if (req.body.rating) review.rating = req.body.rating;
  if (req.body.comment) review.comment = req.body.comment;

  await review.save();

  await updateProductRating(review.productId);

  res.status(200).json({
    success: true,
    data: review,
  });
});

////////////////////////////
// Delete Review
////////////////////////////
export const deleteReview = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.reviewId)) {
    return next(new CustomError('Invalid review ID', 400));
  }

  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return next(new CustomError('Review not found!', 404));
  }

  if (review.reviewer.toString() !== req.user._id.toString()) {
    return next(new CustomError('You are not the owner of this review', 403));
  }

  await review.deleteOne();
  await updateProductRating(review.productId);
  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});
