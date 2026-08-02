 module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "أوامر عامة",
    guide: {
			ar: "   {pn} [البيانات المطلوبة]: طريقة الاستخدام بالعربية",
      en: "Use {p}uptime to display bot's uptime and user stats."
    }
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    try {
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();
      const uptime = process.uptime();

      const days = Math.floor(uptime / (60 * 60 * 24));
      const hours = Math.floor((uptime % (60 * 60 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      const uptimeString = `${days}D ${hours}H ${minutes}M`;

      const msg = 
`╭─🎀 𝙔𝙊𝙐𝙍 𝘽𝙊𝙏 𝙐𝙋𝙏𝙄𝙈𝙀
│
├🐤 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptimeString}  
├👥 𝗧𝗼𝘁𝗮𝗹 𝗨𝘀𝗲𝗿𝘀: ${allUsers.length.toLocaleString()}  
├💬 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝘀: ${allThreads.length.toLocaleString()}  
│
╰───────────────◉`;

      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred while retrieving uptime or user data.", event.threadID, event.messageID);
    }
  }
};
