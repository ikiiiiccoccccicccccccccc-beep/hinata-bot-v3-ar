module.exports = {
	config: {
		name: "unsend",
		aliases:["uns", "un", "u", "r"],
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			ar: "أمر مترجم بالكامل للغة العربية",
			vi: "Gỡ tin nhắn của bot",
			en: "Unsend bot's message"
		},
		category: "أوامر عامة",
		guide: {
			vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
			en: "reply the message you want to unsend and call the command {pn}"
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
		vi: {
			syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot"
		},
		en: {
			syntaxError: "Please reply the message you want to unsend"
		}
	},

	onStart: async function ({ message, event, api, getLang }) {
		if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
			return message.reply(getLang("syntaxError"));
		message.unsend(event.messageReply.messageID);
	}
};
