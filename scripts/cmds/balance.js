module.exports = {
        config: {
                name: "balance",
                aliases: ["bal", "টাকা"],
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
			ar: "أمر مترجم بالكامل للغة العربية",
                        bn: "আপনার বা ট্যাগ করা ইউজারের ব্যালেন্স দেখুন (Short Form)",
                        en: "View your money or tagged person money in formatted style",
                        vi: "Xem số tiền của bạn hoặc người được tag (định dạng ngắn)"
                },
                category: "أوامر عامة",
                guide: {
                        bn: '   {pn}: নিজের ব্যালেন্স দেখতে\n   {pn} @tag: কারো ব্যালেন্স দেখতে',
                        en: '   {pn}: View your money\n   {pn} @tag: View the money of the tagged person',
                        vi: '   {pn}: Xem số tiền của bạn\n   {pn} @tag: Xem số tiền của người được tag'
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
                        money: "বেবি, তোমার কাছে মোট %1$ আছে।",
                        moneyOf: "%1 এর কাছে মোট %2$ আছে।"
                },
                en: {
                        money: "Baby, you have a total of %1$.",
                        moneyOf: "%1 has a total of %2$."
                },
                vi: {
                        money: "🏦 | Bạn đang có %1$",
                        moneyOf: "💰 | %1 đang có %2$"
                }
        },

        onStart: async function ({ message, usersData, event, getLang }) {
                const { mentions, senderID } = event;

                 const formatNumber = (num) => {
                        if (!num) return "0";
                        let n = typeof num !== "number" ? parseInt(num) || 0 : num;
                        const units = ["", "K", "M", "B", "T"];
                        let unit = 0;
                        while (n >= 1000 && ++unit < units.length) n /= 1000;
                        return n.toFixed(1).replace(/\.0$/, "") + units[unit];
                };

                if (Object.keys(mentions).length > 0) {
                        const uids = Object.keys(mentions);
                        let msg = "";
                        for (const uid of uids) {
                                const userMoney = await usersData.get(uid, "money");
                                const name = mentions[uid].replace("@", "");
                                msg += getLang("moneyOf", name, formatNumber(userMoney)) + '\n';
                        }
                        return message.reply(msg);
                } else {
                        const userMoney = await usersData.get(senderID, "money");
                        return message.reply(getLang("money", formatNumber(userMoney)));
                }
        }
};
