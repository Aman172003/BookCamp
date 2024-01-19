const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// plugging in out passport-local-mongoose in the Schema
// it will add a username, a hash and a salt field to store the username, the hash password, salt value
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema); 