const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Transporter using Brevo SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendWelcomeEmail = async (toEmail, name) => {
    try {
        console.log(`Attempting to send Welcome Email to ${toEmail}...`);
        const info = await transporter.sendMail({
            from: `"Planora Support" <${process.env.SENDER_EMAIL}>`,
            to: toEmail,
            subject: 'Welcome to Planora - Your Construction Management Partner',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        .email-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFCF8; padding: 40px; color: #2A1F1D; }
                        .content-card { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(74, 52, 46, 0.08); border: 1px solid #E3DACD; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo-text { font-size: 28px; font-weight: bold; color: #4A342E; letter-spacing: -1px; }
                        .welcome-title { color: #C06842; font-size: 24px; margin-bottom: 20px; text-align: center; }
                        .section-title { color: #4A342E; font-size: 18px; font-weight: 600; margin-top: 25px; margin-bottom: 10px; }
                        .body-text { font-size: 16px; line-height: 1.7; color: #6E5E56; margin-bottom: 15px; }
                        .feature-list { list-style: none; padding: 0; margin-bottom: 20px; }
                        .feature-item { padding: 10px 0; border-bottom: 1px solid #F9F7F2; display: flex; align-items: center; color: #4A342E; font-size: 15px; }
                        .feature-icon { margin-right: 12px; color: #C06842; font-weight: bold; }
                        .cta-button { display: inline-block; background-color: #4A342E; color: #ffffff !important; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 30px 0; transition: background-color 0.3s ease; text-align: center; width: 80%; }
                        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E3DACD; font-size: 14px; text-align: center; color: #999; }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="content-card">
                            <div class="header">
                                <span class="logo-text">Planora</span>
                            </div>
                            
                            <h1 class="welcome-title">Welcome Aboard, ${name}</h1>
                            
                            <p class="body-text">We are delighted to formally welcome you to <strong>Planora</strong>. You have taken a significant step toward modernizing your construction management experience.</p>
                            
                            <p class="body-text">Planora is more than just a tool; it is your digital partner in ensuring every structural detail, design choice, and project milestone is managed with absolute precision.</p>

                            <div class="section-title">What you can do with Planora:</div>
                            <ul class="feature-list">
                                <li class="feature-item"><span class="feature-icon">✓</span> Real-time project tracking and site progress</li>
                                <li class="feature-item"><span class="feature-icon">✓</span> Seamless collaboration between landowners and professionals</li>
                                <li class="feature-item"><span class="feature-icon">✓</span> Centralized document and drawing management</li>
                                <li class="feature-item"><span class="feature-icon">✓</span> Integrated material and budget monitoring</li>
                            </ul>

                            <div style="text-align: center;">
                                <a href="http://localhost:5173/login" class="cta-button">Go to Your Dashboard</a>
                            </div>

                            <p class="body-text">We are committed to providing you with the most efficient platform to bring your construction vision to life. Should you have any inquiries regarding the platform's capabilities, our specialist support team is available to assist you.</p>
                            
                            <p class="body-text" style="margin-top: 30px;">Professional Regards,<br/><strong>The Planora Executive Team</strong></p>
                            
                            <div class="footer">
                                &copy; 2026 Planora Technologies. All rights reserved.<br/>
                                <small>This is an automated communication. Please do not reply directly to this email.</small>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        console.log('Welcome email sent successfully: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('CRITICAL: Error sending welcome email:', error);
        throw error;
    }
};

const sendOTPEmail = async (toEmail, otp) => {
    try {
        console.log(`Attempting to send OTP Email to ${toEmail}...`);
        const info = await transporter.sendMail({
            from: `"Planora Security" <${process.env.SENDER_EMAIL}>`,
            to: toEmail,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFCF8; padding: 40px; color: #2A1F1D;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E3DACD;">
                        <h2 style="color: #4A342E; margin-top: 0;">Password Reset Verification</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">We received a request to reset the password for your Planora account.</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">Please use the following One-Time Password (OTP) to proceed. This code is valid for 10 minutes.</p>
                        
                        <div style="background-color: #F9F7F2; border: 1px solid #E3DACD; padding: 15px; margin: 25px 0; text-align: center; border-radius: 4px;">
                            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #C06842;">${otp}</span>
                        </div>
                        
                        <p style="font-size: 14px; color: #999; margin-top: 20px;">If you did not request a password reset, please ignore this email or contact support immediately.</p>
                        <p style="font-size: 16px; line-height: 1.6; margin-top: 30px; color: #6E5E56;">Best regards,<br/><strong>The Planora Security Team</strong></p>
                    </div>
                </div>
            `
        });
        console.log('OTP email sent successfully: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('CRITICAL: Error sending OTP email:', error);
        throw error;
    }
};

module.exports = {
    sendWelcomeEmail,
    sendOTPEmail
};
