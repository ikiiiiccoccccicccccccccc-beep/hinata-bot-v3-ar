const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "murgi",
                aliases: ["chicken", "মুরগি"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
			ar: "أمر مترجم بالكامل للغة العربية",
                        bn: "কাউকে মুরগি বানিয়ে মজার ছবি তৈরি করুন",
                        en: "Create a funny murgi (hen) image of someone",
                        vi: "Tạo một bức ảnh gà vui nhộn về ai đó"
                },
                category: "أوامر عامة",
                guide: {
                        bn: '   {pn} <@tag/reply/UID>: কাউকে মুরগি বানাতে ট্যাগ করুন',
                        en: '   {pn} <@tag/reply/UID>: Tag/Reply to make someone murgi',
                        vi: '   {pn} <@tag/reply/UID>: Gắn thẻ để biến ai đó thành gà'
                }
        },

        langs: {
                ar: {
                        noImage: "• عزيزي، يرجى الرد على صورة أو إرفاق رابط الصورة! 😘",
                        success: "✅ | تم تجهيز ورفع جودة الصورة بنجاح 🌸",
                        error: "× حدث خطأ أثناء المعالجة: %1. يرجى الملاحظة والإنعاش.",
                        invalidUrl: "❌ | الرابط غير صالحة أو غير مدعوم.",
                        missingArgs: "⚠️ | يرجى كتابة البيانات المطلوبة بعد الأمر.",
                        notFound: "❌ | لم يتم العثور على أي بيانات مطابقة."
                },
                bn: {
                        noTarget: "× বেবি, কাউকে মেনশন দাও, রিপ্লাই করো অথবা UID দাও! 🐓",
                        success: "এই নাও তোমার মুরগি ছবি বেবি! 🐸",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।"
                },
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 🐓",
                        success: "Here's your murgi image baby! 🐸",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noTarget: "× Cưng ơi, hãy gắn thẻ, phản hồi hoặc cung cấp UID! 🐓",
                        success: "Ảnh con gà của cưng đây! 🐸",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { mentions, messageReply } = event;
                let id;

                if (Object.keys(mentions).length > 0) {
                        id = Object.keys(mentions)[0];
                } else if (messageReply) {
                        id = messageReply.senderID;
                } else if (args[0] && !isNaN(args[0])) {
                        id = args[0];
                }

                if (!id) return message.reply(getLang("noTarget"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const filePath = path.join(cacheDir, `murgi_${id}.png`);

                try {
                        api.setMessageReaction("🐓", event.messageID, () => {}, true);
                        
                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/murgi?user=${id}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Murgi Error:", err);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
