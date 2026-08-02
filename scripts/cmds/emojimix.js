const axios = require("axios");
 
const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "emojimix",
                aliases: ["mix", "ইমোজি"],
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
			ar: "أمر مترجم بالكامل للغة العربية",
                        bn: "দুটি ইমোজি মিক্স করে নতুন স্টিকার তৈরি করুন",
                        en: "Mix two emojis to create a new sticker",
                        vi: "Trộn hai biểu tượng cảm xúc để tạo một nhãn dán mới"
                },
                category: "أوامر عامة",
                guide: {
                        bn: '   {pn} <emoji1> <emoji2>\n   উদাহরণ: {pn} 🙂 😘',
                        en: '   {pn} <emoji1> <emoji2>\n   Example: {pn} 🙂 😘',
                        vi: '   {pn} <emoji1> <emoji2>\n   Ví dụ: {pn} 🙂 😘'
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
                        error: "× দুঃখিত বেবি, %1 এবং %2 মিক্স করা সম্ভব নয়। 🥺",
                        success: "✨ | এই নাও তোমার মিক্স ইমোজি: %1 + %2",
                        invalid: "• দয়া করে দুটি ইমোজি দিন\n\nউদাহরণ: {pn} 😘 🙂"
                },
                en: {
                        error: "× Sorry baby, emoji %1 and %2 can't be mixed. 🥺",
                        success: "✨ | Emoji %1 and %2 mixed successfully!",
                        invalid: "• Please provide two emojis\n\nExample: {pn} 😘 🙂"
                },
                vi: {
                        error: "❌ Xin lỗi, biểu tượng cảm xúc %1 và %2 không thể trộn lẫn.",
                        success: "✨ | Đã trộn biểu tượng cảm xúc %1 và %2 thành công!",
                        invalid: "• Vui lòng cung cấp hai biểu tượng cảm xúc\n\nVí dụ: {pn} 😘 🙂"
                }
        },

        onStart: async function ({ api, message, event, args, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68); 
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const prefix = global.utils.getPrefix(event.threadID);
                const [emoji1, emoji2] = args;

                if (!emoji1 || !emoji2) {
                        const invalidMsg = getLang("invalid").replace(/{pn}/g, prefix + this.config.name);
                        return api.sendMessage(invalidMsg, event.threadID, event.messageID);
                }

                try {
                        api.setMessageReaction("✨", event.messageID, () => {}, true);
                        const image = await generateEmojimix(emoji1, emoji2);

                        if (!image) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return api.sendMessage(getLang("error", emoji1, emoji2), event.threadID, event.messageID);
                        }

                        return api.sendMessage({
                                body: getLang("success", emoji1, emoji2),
                                attachment: image
                        }, event.threadID, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                        }, event.messageID);

                } catch (e) {
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return api.sendMessage(getLang("error", emoji1, emoji2), event.threadID, event.messageID);
                }
        }
};

async function generateEmojimix(emoji1, emoji2) {
        try {
                const baseUrl = await baseApiUrl();
                const apiUrl = `${baseUrl}/api/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;
                const response = await axios.get(apiUrl, {
                        headers: { "Author": "MahMUD" },
                        responseType: "stream"
                });

                if (response.data.error) return null;
                return response.data;
        } catch (error) {
                return null;
        }
}
