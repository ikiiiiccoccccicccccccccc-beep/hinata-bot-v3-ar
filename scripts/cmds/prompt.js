const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "prompt",
                aliases: ["p"],
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
			ar: "أمر مترجم بالكامل للغة العربية",
                        bn: "যেকোনো ছবি থেকে বিস্তারিত প্রম্পট বা বর্ণনা তৈরি করুন",
                        en: "Generate a detailed prompt or description from any image",
                        vi: "Tạo lời nhắc hoặc mô tả chi tiết từ bất kỳ hình ảnh nào"
                },
                category: "أوامر عامة",
                guide: {
                        bn: '   {pn}: একটি ছবিতে রিপ্লাই দিয়ে ব্যবহার করুন\n   {pn} <প্রশ্ন>: ছবির সাথে প্রশ্নও করতে পারেন',
                        en: '   {pn}: Reply to an image\n   {pn} <custom prompt>: Ask specific about the image',
                        vi: '   {pn}: Phản hồi một hình ảnh\n   {pn} <lời nhắc>: Hỏi cụ thể về hình ảnh'
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
                        noImg: "× বেবি, একটি ছবিতে রিপ্লাই দিয়ে কমান্ডটি ব্যবহার করো! 🖼️",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।"
                },
                en: {
                        noImg: "× Baby, please reply to an image to use this command! 🖼️",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noImg: "× Cưng ơi, vui lòng phản hồi một hình ảnh để sử dụng! 🖼️",
                        error: "× Lỗi: %1. Liên hệ MahMUD để được hỗ trợ."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                if (!(event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo")) {
                        return message.reply(getLang("noImg"));
                }

                const prompt = args.join(" ") || "Describe this image in detail";
                const imageUrl = event.messageReply.attachments[0].url;

                try {
                        const baseUrl = await mahmud();
                        const apiUrl = `${baseUrl}/api/prompt`;

                        const response = await axios.post(apiUrl, {
                                imageUrl,
                                prompt
                        }, {
                                headers: { 
                                        "Content-Type": "application/json", 
                                        "author": authorName 
                                }
                        });

                        const replyText = response.data.response || response.data.error || "No response";
                        
                        message.reply(replyText);
                        return api.setMessageReaction("🪽", event.messageID, () => {}, true);

                } catch (err) {
                        console.error("Prompt AI Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
