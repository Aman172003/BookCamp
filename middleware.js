const {campgroundSchema, reviewSchema} = require('./schema');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground'); 
const Review = require('./models/review')

// this meddleware is used in routed to verify wheteher user is logged in or not
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // undifined
        console.log(req.session.returnTo)
        req.session.returnTo = req.originalUrl; // add this line
        console.log(req.session.returnTo)
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        console.log(res.locals.returnTo)
        res.locals.returnTo = req.session.returnTo;
        console.log(res.locals.returnTo)
    }
    next();
}

// joi validation middleware
module.exports.validateCampground = (req, res, next) => {
    // validating requested data
    const {error} = campgroundSchema.validate(req.body);

    if(error) {
        // err.details will be an array of objects
        const msg = error.details.map(el => el.message).join(','); 
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// middleware to verify the current user is author or not
module.exports.isAuthor = async(req, res, next) => {
    const {id} = req.params;
    const campground = await Campground.findById(id)
    // if current user is not the author then will not be able to update
    // after clicking update error msg will be shown
    if(!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error) {
        // err.details will be an array of objects
        const msg = error.details.map(el => el.message).join(','); 
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isReviewAuthor = async(req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId)
    // if current user is not the author then will not be able to update
    // after clicking update error msg will be shown
    if(!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}