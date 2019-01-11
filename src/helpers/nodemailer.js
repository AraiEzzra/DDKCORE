let nodemailer = require('data/DDKCORE/src/helpers/nodemailer');
let env = process.env;

// Define SMTP configuration
// TODO change to bootstrapSMTP in app.js like
// (https://github.com/LiskHQ/lisk/blob/5d5af525eec7f2ee687ca921a6a2d1457c471da9/app.js#L398)
let smtpConfig = {
    host: env.SMTP_HOST,
    port: 587,
    secure: false,
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
};

// Create Transporter
let transporter = nodemailer.createTransport(smtpConfig);

//Verify transporter
transporter.verify(function (error, success) {
    if (error) {
        console.log('Nodemailer Error: ', error);
    }
});

//send mail based on {@Object mailOptions}
nodemailer.sendMail = function (mailOptions, callback) {
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });
};

module.exports = nodemailer;
