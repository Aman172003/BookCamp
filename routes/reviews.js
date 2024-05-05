const express = require('express');
// id can be accessed, as we were unable to do before
// we do it by {mergeParams: true}
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync')
const { isLoggedIn, isReviewAuthor} = require('../middleware')
const reviews = require('../controllers/reviews');


router.post('/', isLoggedIn, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))

module.exports = router; 