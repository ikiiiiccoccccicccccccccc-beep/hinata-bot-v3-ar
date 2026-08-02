module.exports = {
	config: {
		name: "sorthelp",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			ar: "أمر مترجم بالكامل للغة العربية",
			vi: "Sắp xếp danh sách help",
			en: "Sort help list"
		},
		category: "أوامر عامة",
		guide: {
			en: "{pn} [name | category]"
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
			savedName: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự chữ cái",
			savedCategory: "Đã lưu cài đặt sắp xếp danh sách help theo thứ tự thể loại"
		},
		en: {
			savedName: "Saved sort help list by name",
			savedCategory: "Saved sort help list by category"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (args[0] == "name") {
			await threadsData.set(event.threadID, "name", "settings.sortHelp");
			message.reply(getLang("savedName"));
		}
		else if (args[0] == "category") {
			threadsData.set(event.threadID, "category", "settings.sortHelp");
			message.reply(getLang("savedCategory"));
		}
		else
			message.SyntaxError();
	}
};