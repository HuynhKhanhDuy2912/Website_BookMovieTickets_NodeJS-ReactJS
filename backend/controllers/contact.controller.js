const nodemailer = require("nodemailer");

exports.sendContactEmail = async (req, res) => {
    const { name, email, content } = req.body;

    try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Email không hợp lệ!" });
        }

        if (content.length < 10) {
            return res.status(400).json({ success: false, message: "Nội dung quá ngắn, vui lòng viết chi tiết hơn!" });
        }
        // Cấu hình transporter (người đưa thư)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "jungdung2004@gmail.com", // Email Admin (dùng để gửi)
                pass: "jpwy dgeu gemw evte", // App Password của Google
            },
        });

        // Cấu hình nội dung mail
        const mailOptions = {
            from: `"${name}" <${email}>`, // Hiển thị người gửi
            to: "jungdung2004@gmail.com", // Gửi về cho chính bạn (Admin) để đọc
            subject: `[Liên Hệ Cinema] Thắc mắc từ ${name}`,
            html: `
        <h3>Bạn có liên hệ mới từ Website Cinema</h3>
        <p><strong>Họ tên:</strong> ${name}</p>
        <p><strong>Email khách:</strong> ${email}</p>
        <p><strong>Nội dung:</strong></p>
        <p style="background: #f3f3f3; padding: 10px; border-radius: 5px;">${content}</p>
      `,
        };

        // Gửi mail
        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Đã gửi email thành công!" });
    } catch (error) {
        console.error("Lỗi gửi mail:", error);
        res.status(500).json({ success: false, message: "Gửi mail thất bại", error: error.message });
    }
};