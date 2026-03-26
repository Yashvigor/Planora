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
            from: `"Planora" <${process.env.SENDER_EMAIL}>`,
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
                                <span class="logo-text" style="display: block; font-size: 32px; color: #4A342E; margin-bottom: 5px;">Planora</span>
                            </div>
                            
                            <h1 class="welcome-title" style="color: #C06842; font-size: 24px; margin-top: 0;">Welcome, ${name}</h1>
                            
                            <p class="body-text">We are delighted to formally welcome you to <strong>Planora</strong>. You have taken a significant step toward modernizing your construction management experience.</p>
                            
                            <p class="body-text">Planora is more than just a tool; it is your digital partner in ensuring every structural detail, design choice, and project milestone is managed with absolute precision.</p>

                            <div class="section-title">What you can do with Planora:</div>
                             <ul class="feature-list" style="list-style: none; padding: 0;">
                                <li class="feature-item" style="padding: 10px 0; border-bottom: 1px solid #F9F7F2; color: #4A342E; font-size: 15px;"><span style="color: #C06842; font-weight: bold; margin-right: 12px;">✓</span> Real-time project tracking and site progress</li>
                                <li class="feature-item" style="padding: 10px 0; border-bottom: 1px solid #F9F7F2; color: #4A342E; font-size: 15px;"><span style="color: #C06842; font-weight: bold; margin-right: 12px;">✓</span> Seamless collaboration between landowners and professionals</li>
                                <li class="feature-item" style="padding: 10px 0; border-bottom: 1px solid #F9F7F2; color: #4A342E; font-size: 15px;"><span style="color: #C06842; font-weight: bold; margin-right: 12px;">✓</span> Centralized document and drawing management</li>
                                <li class="feature-item" style="padding: 10px 0; border-bottom: 1px solid #F9F7F2; color: #4A342E; font-size: 15px;"><span style="color: #C06842; font-weight: bold; margin-right: 12px;">✓</span> Integrated material and budget monitoring</li>
                            </ul>

                            <div style="text-align: center;">
                                <a href="http://localhost:5173/login" class="cta-button">Go to Your Dashboard</a>
                            </div>

                            <p class="body-text">We are committed to providing you with the most efficient platform to bring your construction vision to life. Should you have any inquiries regarding the platform's capabilities, our specialist support team is available to assist you.</p>
                            
                             <p class="body-text" style="margin-top: 30px;">Regards,<br/><strong>The Planora Team</strong></p>
                            
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
            from: `"Planora" <${process.env.SENDER_EMAIL}>`,
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

const sendVerificationEmail = async (toEmail, name, status, reason) => {
    try {
        console.log(`Attempting to send Verification Email (${status}) to ${toEmail}...`);

        let title, messageBody, color;
        if (status === 'Approved') {
            title = 'Account Verified successfully';
            color = '#22c55e'; // green-500
            messageBody = `
                <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">We are pleased to inform you that your documents and credentials have been successfully reviewed and <strong>approved</strong> by our administration team.</p>
                <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">You now have full access to your professional dashboard and can begin collaborating on projects immediately.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: ${color}; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Dashboard</a>
                </div>
            `;
        } else {
            title = 'Account Verification Update';
            color = '#ef4444'; // red-500
            messageBody = `
                <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">Thank you for registering. After careful review, your recent document submission has been <strong>rejected</strong>.</p>
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 25px 0; border-radius: 6px; border-left: 4px solid ${color};">
                    <strong style="color: #991b1b; display: block; margin-bottom: 5px;">Reason provided by Administration:</strong>
                    <p style="color: #991b1b; margin: 0; font-style: italic;">"${reason || 'Invalid or incomplete documentation'}"</p>
                </div>
                <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">Please log in to your account to review the necessary changes, update your profile, and resubmit your documents for verification.</p>
            `;
        }

        const info = await transporter.sendMail({
            from: `"Planora" <${process.env.SENDER_EMAIL}>`,
            to: toEmail,
            subject: `Planora Account Verification: ${status}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFCF8; padding: 40px; color: #2A1F1D;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 35px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); border: 1px solid #E3DACD;">
                        <h2 style="color: ${color}; margin-top: 0; font-size: 22px;">${title}</h2>
                        <p style="font-size: 16px; color: #4A342E; font-weight: bold;">Dear ${name},</p>
                        ${messageBody}
                        <p style="font-size: 15px; line-height: 1.6; margin-top: 35px; color: #8C7B70;">Best regards,<br/><strong style="color: #4A342E;">Planora Administration Team</strong></p>
                    </div>
                </div>
            `
        });
        console.log('Verification email sent successfully: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('CRITICAL: Error sending verification email:', error);
        // We don't throw because we don't want to crash the verification flow if email fails
    }
};

const sendAuctionWinEmail = async (toEmail, name, landTitle, bidAmount) => {
    try {
        console.log(`Attempting to send Auction Win Email to ${toEmail}...`);
        const info = await transporter.sendMail({
            from: `"Planora" <${process.env.SENDER_EMAIL}>`,
            to: toEmail,
            subject: 'Exclusive Victory: You have Won the Auction! 🏆',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFCF8; padding: 40px; color: #2A1F1D;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 35px; border-radius: 12px; box-shadow: 0 12px 30px rgba(74, 52, 46, 0.1); border: 1px solid #E3DACD;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <span style="font-size: 48px;">🏆</span>
                        </div>
                        <h2 style="color: #A65D4D; margin-top: 0; font-size: 26px; text-align: center;">Victory is Yours!</h2>
                        <p style="font-size: 16px; color: #4A342E; font-weight: bold;">Dear ${name},</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">We are absolutely thrilled to inform you that you have emerged as the <strong>highest bidder</strong> in our recent auction.</p>
                        
                        <div style="background-color: #F9F7F2; border: 1px solid #E3DACD; padding: 25px; margin: 30px 0; border-radius: 12px; text-align: center;">
                            <p style="color: #8C7B70; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 2px; margin-bottom: 5px;">Property Secured</p>
                            <p style="color: #2A1F1D; font-size: 20px; font-weight: bold; margin-bottom: 15px;">${landTitle}</p>
                            <p style="color: #8C7B70; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 2px; margin-bottom: 5px;">Final Bid Value</p>
                            <p style="color: #C06842; font-size: 32px; font-weight: 900; margin: 0;">₹${parseFloat(bidAmount).toLocaleString()}</p>
                        </div>

                        <p style="font-size: 16px; line-height: 1.6; color: #6E5E56;">This property is now reserved for you. Please proceed to your dashboard to complete the final documentation and payment steps.</p>

                        <div style="text-align: center; margin-top: 40px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/bidding" style="display: inline-block; background-color: #2A1F1D; color: #ffffff !important; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(42, 31, 29, 0.2);">Claim Your Property</a>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin-top: 45px; color: #8C7B70; text-align: center;">Best regards,<br/><strong style="color: #4A342E;">The Planora Auctions Team</strong></p>
                    </div>
                </div>
            `
        });
        console.log('Auction win email sent successfully: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('CRITICAL: Error sending auction win email:', error);
    }
};


const sendDeactivatedEmail = async (toEmail, name, reason) => {
    try {
        console.log(`Sending Deactivation Email to ${toEmail}...`);
        const info = await transporter.sendMail({
            from: `"Planora" <${process.env.SENDER_EMAIL}>`,
            to: toEmail,
            subject: 'Urgent: Your Planora Account Has Been Suspended',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fef2f2; padding: 40px; color: #2A1F1D;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.1); border: 1px solid #fee2e2;">
                        <h2 style="color: #ef4444; margin-top: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Account Suspension Notice</h2>
                        <p style="font-size: 16px; color: #4A342E; font-weight: bold;">Dear ${name},</p>
                        <p style="font-size: 16px; line-height: 1.8; color: #6E5E56;">We are writing to inform you that your Planora account has been <strong>suspended due to suspicious activities</strong> or non-compliance with our platform policies.</p>
                        
                        <div style="background-color: #fff1f2; border: 1px solid #fda4af; padding: 20px; margin: 30px 0; border-radius: 12px; border-left: 6px solid #ef4444;">
                            <strong style="color: #9f1239; display: block; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Official Suspension Reason:</strong>
                            <p style="color: #9f1239; margin: 0; font-size: 16px; font-style: italic;">"${reason || 'No specific reason provided'}"</p>
                        </div>
                        
                        <p style="font-size: 15px; line-height: 1.7; color: #6E5E56;"><strong>Immediate Impact:</strong> Access to your dashboard, ongoing projects, and communication tools has been revoked effectively immediately.</p>
                        <p style="font-size: 15px; line-height: 1.7; color: #6E5E56;">If you believe this action was taken in error, you may submit a formal appeal through our portal. You will be required to provide clarifying documentation and an explanation for the mentioned local activities.</p>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #ef4444; color: #ffffff !important; padding: 18px 45px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">Submit Formal Appeal</a>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin-top: 45px; color: #9ca3af; text-align: center;">This is a system-generated security alert.<br/>Regards,<br/><strong style="color: #4A342E;">Planora Security & Administration</strong></p>
                    </div>
                </div>
            `
        });
        return info;
    } catch (e) {
        console.error('Error sending deactivation email:', e);
    }
};

const sendReactivatedEmail = async (toEmail, name) => {
    try {
        console.log(`Sending Reactivation Email to ${toEmail}...`);
        const info = await transporter.sendMail({
            from: `"Planora" <${process.env.SENDER_EMAIL}>`,
            to: toEmail,
            subject: 'Welcome Back: Your Planora Account Has Been Reinstated',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 40px; color: #2A1F1D;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.08); border: 1px solid #dcfce7;">
                        <h2 style="color: #22c55e; margin-top: 0; font-size: 24px;">Account Access Restored</h2>
                        <p style="font-size: 16px; color: #4A342E; font-weight: bold;">Dear ${name},</p>
                        <p style="font-size: 16px; line-height: 1.8; color: #6E5E56;">After reviewing your appeal and documentation, we are pleased to inform you that your account has been <strong>successfully reinstated</strong>.</p>
                        <p style="font-size: 16px; line-height: 1.8; color: #6E5E56;">You now have full access to your projects and the professional marketplace. We appreciate your patience during this verification process.</p>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #22c55e; color: #ffffff !important; padding: 18px 45px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Return to Dashboard</a>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin-top: 45px; color: #9ca3af; text-align: center;">Regards,<br/><strong style="color: #4A342E;">Planora Administration Team</strong></p>
                    </div>
                </div>
            `
        });
        return info;
    } catch (e) {
        console.error('Error sending reactivation email:', e);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendOTPEmail,
    sendVerificationEmail,
    sendAuctionWinEmail,
    sendDeactivatedEmail,
    sendReactivatedEmail
};
