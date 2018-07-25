let postmark = require("postmark");
let env = process.env;

// Send an email:
let client = new postmark.Client(env.POSTMARK_KEY);

postmark.sendMail = function(mailOptions,callback) {
    client.sendEmail(mailOptions,function(err){
        if(err) {
            return callback(err);
        }
        return callback(null);
    });
};

module.exports = postmark;
