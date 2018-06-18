let nodemailer = require('nodemailer');
let env = process.env;

// Define SMTP configuration
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
nodemailer.sendMail = function (mailOptions, config, callback) {
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });
};

module.exports = nodemailer;
