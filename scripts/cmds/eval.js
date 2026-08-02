const { removeHomeDir, log } = global.utils;

module.exports = {
	config: {
		name: "eval",
		version: "1.6",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			ar: "أمر مترجم بالكامل للغة العربية",
			vi: "Test code nhanh",
			en: "Test code quickly"
		},
		category: "أوامر عامة",
		guide: {
			vi: "{pn} <đoạn code cần test>",
			en: "{pn} <code to test>"
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
			error: "❌ Đã có lỗi xảy ra:"
		},
		en: {
			error: "❌ An error occurred:"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
		function output(msg) {
			if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
				msg = msg.toString();
			else if (msg instanceof Map) {
				let text = `Map(${msg.size}) `;
				text += JSON.stringify(mapToObj(msg), null, 2);
				msg = text;
			}
			else if (typeof msg == "object")
				msg = JSON.stringify(msg, null, 2);
			else if (typeof msg == "undefined")
				msg = "undefined";

			message.reply(msg);
		}
		function out(msg) {
			output(msg);
		}
		function mapToObj(map) {
			const obj = {};
			map.forEach(function (v, k) {
				obj[k] = v;
			});
			return obj;
		}
		const cmd = `
		(async () => {
			try {
				${args.join(" ")}
			}
			catch(err) {
				log.err("eval command", err);
				message.send(
					"${getLang("error")}\\n" +
					(err.stack ?
						removeHomeDir(err.stack) :
						removeHomeDir(JSON.stringify(err, null, 2) || "")
					)
				);
			}
		})()`;
		eval(cmd);
	}
};