const User = require('../models/user');

// it will render the register form
module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

// logic for registering the user
module.exports.register = async (req, res) => {
    try{
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        // when you register then you don't need to sign in again
        // below will automatically do it
        req.login(registeredUser, err => {
            if(err) return next(err);
            req.flash('success', 'Welcome to Yelpcamp');
            res.redirect('/campgrounds');
        })
        
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('register')
    } 
}

// render the login page
module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

// logic for logging in
module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = res.locals.returnTo || '/campgrounds'; // update this line to use res.locals.returnTo now
    res.redirect(redirectUrl);
}

// logic for logging out
module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}