function getWelcomeEmailContent(
  email,
  password,
  otp,
  loginUrl = "https://fanbox.app/login"
) {
  console.log(otp, "OTP is coming here");
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Welcome to Fanbox</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        padding: 30px;
      }
      h1 {
        color: #ff4d4f;
      }
      p {
        font-size: 16px;
        color: #333333;
      }
      .credentials {
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        font-family: monospace;
      }
      a.button {
        display: inline-block;
        background-color: #ff4d4f;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to Fanbox!</h1>
      <p>Hi there,</p>
      <p>Thank you for joining <strong>Fanbox</strong>! Your account has been created successfully. Below are your login details:</p>

      <div class="credentials">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>OTP:</strong> ${otp}</p>
      </div>

      <p>Please keep this information safe and do not share it with anyone.</p>
      
      <p>You can log in to your Fanbox account by clicking the button below:</p>
      <a class="button" href="${loginUrl}">Login to Fanbox</a>

      <p>We’re excited to have you onboard!</p>
      <p>Best regards,<br>Fanbox Team</p>
    </div>
  </body>
  </html>
  `;
}

module.exports = getWelcomeEmailContent;
