let postmark = require("postmark");

// Send an email:
// TODO change to bootstrapPostmark in which will be use in app.js
let client = new postmark.Client(process.env.POSTMARK_KEY);

postmark.sendEmailWithTemplate = function(mailOptions,callback) {
    client.sendEmailWithTemplate(mailOptions,function(err){
        if(err) {
            return callback(err);
        }
        return callback(null);
    });
};

postmark.sendMail = function(mailOptions,callback) {
    client.sendEmail(mailOptions,function(err){
        if(err) {
            return callback(err);
        }
        return callback(null);
    });
};

module.exports = postmark;
