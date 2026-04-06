import Mailgen from "mailgen";
import nodemailer from "nodemailer"


const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "OmniCart",
            link: "omnicartlink.com",
        },
    });

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

    const emailHtml = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USERNAME,
            password: process.env.MAILTRAP_SMTP_PASSWORD,
        }

    });

    const mail = {
        from: "mail.omnicart@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    }

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email Service Failed!", error);
    }
}

const emailVerificationMailService = (firstName, lastName, verificationURL) => {

    return {
        body: {
            name: `${firstName} ${lastName}`,
            intro: "Welcome to OmniCart!",
            action: {
                instructions: "To verify your account please click on the following button",
                button: {
                    color: "#22BC66",
                    text: "Verify Account",
                    link: verificationURL,
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

const forgotPasswordEmailService = (firstName, lastName, passwordResetUrl) => {

    return {
        body: {
            name: `${firstName} ${lastName}`,
            intro: "Request for Passoword Reset",
            action: {
                instructions: "To reset your password click on the following button",
                button: {
                    color: "#22BC66",
                    text: "Reset Password",
                    link: passwordResetUrl,
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

const orderConfirmedEmailService = (orderId, firstName, lastName, orderDetailsURL) => {

    return {
        body: {
            name: `${firstName} ${lastName}`,
            intro: `Thank you for your order! 🎉 Your order #${orderId} has been successfully placed.`,
            action: {
                instructions: "You can view your order details here:",
                button: {
                    color: "#22BC66",
                    text: "View Order",
                    link: orderDetailsURL,
                }
            },
            outro: "We’ll notify you once your order is shipped."
        }
    }
}

const orderShippedEmailService = (orderId, firstName, lastName, trackOrderURL) => {
    return {
        body: {
            name: `${firstName} ${lastName}`,
            intro: `Good news! 🚚 Your order #${orderId} has been shipped.`,
            action: {
                instructions: "Track your shipment using the link below:",
                button: {
                    color: "#3869D4",
                    text: "Track Order",
                    link: trackOrderURL,
                }
            },
            outro: "Your package will reach you soon. Stay excited!"
        }
    }
}

const orderCancelEmailService = (orderId, firstName, lastName, orderDetailsURL) => {

    return {
        body: {
            name: `${firstName} ${lastName}`,
            intro: `Your order #${orderId} has been cancelled.`,
            action: {
                instructions: "To check your Order DetailS, Click on the following button:",
                button: {
                    color: "#FF6136",
                    text: "View Order Details",
                    link: orderDetailsURL,
                }
            },
            outro: "If you have any questions, we're here to help."
        }
    }
}

const orderDeliveredEmailSerive = (orderId, firstName, lastName, orderDetailsLink) => {

    return {
        body: {
            name: `${firstName} ${lastName}`,
            intro: `Your order #${orderId} has been delivered successfully! 🎉`,
            action: {
                instructions: "We’d love to hear your feedback:",
                button: {
                    color: "#22BC66",
                    text: "Rate Your Order",
                    link: orderDetailsLink,
                }
            },
            outro: "Thank you for shopping with us. Hope to see you again!"
        }
    }
}

export {
    sendEmail,
    emailVerificationMailService,
    forgotPasswordEmailService,
    orderConfirmedEmailService,
    orderShippedEmailService,
    orderCancelEmailService,
    orderDeliveredEmailSerive,
}