var nodemailer = require('nodemailer');
var env = process.env;

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET
    }
});

nodemailer.sendMail = function(mailOptions, config, callback) {
    transporter.sendMail(mailOptions, function(err, info) {
        if(err) {
            return callback(err);
        }
        //console.log('mail sent successfully');
        return callback(null);
    });
};

module.exports = nodemailer;
