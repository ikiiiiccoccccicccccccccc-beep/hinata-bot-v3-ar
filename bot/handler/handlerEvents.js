const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];

function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
	const adminBot = global.GoatBot.config.adminBot || [];
	if (!senderID)
		return 0;
	const adminBox = threadData ? threadData.adminIDs || [] : [];
	return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function getText(type, reason, time, targetID, lang) {
	const utils = global.utils;
	if (type == "userBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	else if (type == "threadBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	else if (type == "onlyAdminBox")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	else if (type == "onlyAdminBot")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
	return text
		.replace(/\{(?:p|prefix)\}/g, prefix)
		.replace(/\{(?:n|name)\}/g, commandName)
		.replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) {
		roleConfig = {
			onStart: command.config.role
		};
	}
	else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart)
			command.config.role.onStart = 0;
		roleConfig = command.config.role;
	}
	else {
		roleConfig = {
			onStart: 0
		};
	}

	if (isGroup)
		roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		if (roleConfig[key] == undefined)
			roleConfig[key] = roleConfig.onStart;
	}

	return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	const config = global.GoatBot.config;
	const { adminBot, hideNotiMessage } = config;

	const infoBannedUser = userData.banned;
	if (infoBannedUser.status == true) {
		const { reason, date } = infoBannedUser;
		if (hideNotiMessage.userBanned == false)
			message.reply(getText("userBanned", reason, date, senderID, lang));
		return true;
	}

	if (
		config.adminOnly.enable == true
		&& !adminBot.includes(senderID)
		&& !config.adminOnly.ignoreCommand.includes(commandName)
	) {
		if (hideNotiMessage.adminOnly == false)
			message.reply(getText("onlyAdminBot", null, null, null, lang));
		return true;
	}

	if (isGroup == true) {
		if (
			threadData.data.onlyAdminBox === true
			&& !threadData.adminIDs.includes(senderID)
			&& !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
		) {
			if (!threadData.data.hideNotiMessageOnlyAdminBox)
				message.reply(getText("onlyAdminBox", null, null, null, lang));
			return true;
		}

		const infoBannedThread = threadData.banned;
		if (infoBannedThread.status == true) {
			const { reason, date } = infoBannedThread;
			if (hideNotiMessage.threadBanned == false)
				message.reply(getText("threadBanned", reason, date, threadID, lang));
			return true;
		}
	}
	return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandType = command.config.countDown ? "command" : "command event";
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };
	if (fs.existsSync(pathCustomLang))
		customLang = require(pathCustomLang)[commandName]?.text || {};
	if (command.langs || customLang || {}) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = replaceShortcutInLang(lang, prefix, commandName);
			for (let i = args.length - 1; i >= 0; i--)
				lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
		};
	}
	return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {

		// —————————————— AUTHOR SECURITY CHECK —————————————— //
		const { config } = global.GoatBot;
		if (!config.author || !config.author.includes("MahMUD")) {
			console.log("\x1b[31m%s\x1b[0m", "──────────────────────────────────────────");
			console.log("\x1b[31m%s\x1b[0m", " [ ERROR ] » HỆ THỐNG PHÁT HIỆN AUTHOR BỊ THAY ĐỔI!");
			console.log("\x1b[31m%s\x1b[0m", " [ SYSTEM ] » Bot will stop. Author must be 'MahMUD'.");
			console.log("\x1b[31m%s\x1b[0m", "──────────────────────────────────────────");
			return process.exit(0);
		}
		// —————————————————————————————————————————————————— //

		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;

		const { body, messageID, threadID, isGroup } = event;

		if (!threadID)
			return;

		const senderID = event.userID || event.senderID || event.author;

		// —————————————— MENTION LOGIC —————————————— //
		const currentMentions = event.mentions || {};
		event.mentions = {};

		if (event.messageReply && event.messageReply.senderID) {
			event.mentions[event.messageReply.senderID] = "";
		} else if (body && body.includes("@")) {
			try {
				const info = await api.getThreadInfo(threadID);
				const bodyLower = body.toLowerCase();
				const nicknames = info.nicknames || {};
				const participants = info.userInfo || [];

				participants.forEach(user => {
					const uid = user.id;
					const realName = (user.name || "").toLowerCase();
					const nickName = (nicknames[uid] || "").toLowerCase();
					if ((nickName && bodyLower.includes("@" + nickName)) ||
						(realName && bodyLower.includes("@" + realName))) {
						event.mentions[uid] = user.name;
					}
				});
			} catch (e) { event.mentions = currentMentions; }
		} else {
			event.mentions = currentMentions;
		}
		// —————————————————————————————————————————————————— //

		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);

		if (!userData && !isNaN(senderID))
			userData = await usersData.create(senderID);

		if (!threadData && !isNaN(threadID)) {
			if (global.temp.createThreadDataError.includes(threadID))
				return;
			threadData = await threadsData.create(threadID);
			global.db.receivedTheFirstMessage[threadID] = true;
		}
		else {
			if (
				autoRefreshThreadInfoFirstTime === true
				&& !global.db.receivedTheFirstMessage[threadID]
			) {
				global.db.receivedTheFirstMessage[threadID] = true;
				await threadsData.refreshInfo(threadID);
			}
		}

		if (typeof threadData.settings.hideNotiMessage == "object")
			hideNotiMessage = threadData.settings.hideNotiMessage;

		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);
		const parameters = {
			api, usersData, threadsData, message, event,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					throw new Error("Parameters missing for removeCommandNameFromBody");
				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		const langCode = threadData.data.lang || config.language || "en";

		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}

		let isUserCallCommand = false;
		async function onStart() {
			if (!body || !body.startsWith(prefix))
				return;
			const dateNow = Date.now();
			const args = body.slice(prefix.length).trim().split(/ +/);
			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			
			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}
			if (command)
				commandName = command.config.name;

			function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if (arguments.length) {
					return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
				}
				return body.replace(new RegExp(`^${prefix}(\\s+|)${commandName}`, "i"), "").trim();
			}

			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				return;

			if (!command) {
				if (!hideNotiMessage.commandNotFound)
					return await message.reply(
						commandName ?
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix) :
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
					);
				else
					return true;
			}

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onStart;

			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmd) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
					else if (needRole == 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
				}
				return true;
			}

			if (!client.countDown[commandName])
				client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown;
			if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
				getCoolDown = 1;
			const cooldownCommand = getCoolDown * 1000;
			if (timestamps[senderID]) {
				const expirationTime = timestamps[senderID] + cooldownCommand;
				if (dateNow < expirationTime)
					return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
			}

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
				(async () => {
					const analytics = await globalData.get("analytics", "data", {});
					if (!analytics[commandName])
						analytics[commandName] = 0;
					analytics[commandName]++;
					await globalData.set("analytics", analytics, "data");
				})();

				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				await command.onStart({
					...parameters,
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				timestamps[senderID] = dateNow;
				log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			catch (err) {
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}

		async function onChat() {
			const allOnChat = GoatBot.onChat || [];
			const args = body ? body.split(/ +/) : [];
			for (const key of allOnChat) {
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				if (roleConfig.onChat > role) continue;

				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);

				if (getType(command.onChat) == "Function") {
					const defaultOnChat = command.onChat;
					command.onChat = async function () { return defaultOnChat(...arguments); };
				}

				command.onChat({ ...parameters, isUserCallCommand, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
							try {
								await handler();
								log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID}`);
							} catch (err) {
								await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					}).catch(err => log.err("onChat", `Error in ${commandName}`, err));
			}
		}

		async function onAnyEvent() {
			const allOnAnyEvent = GoatBot.onAnyEvent || [];
			let args = (typeof event.body == "string" && event.body.startsWith(prefix)) ? event.body.split(/ +/) : [];

			for (const key of allOnAnyEvent) {
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onAnyEvent) == "Function") {
					const defaultOnAnyEvent = command.onAnyEvent;
					command.onAnyEvent = async function () { return defaultOnAnyEvent(...arguments); };
				}

				command.onAnyEvent({ ...parameters, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							try {
								await handler();
							} catch (err) {
								log.err("onAnyEvent", `Error in ${commandName}`, err);
							}
						}
					}).catch(err => log.err("onAnyEvent", `Error in ${commandName}`, err));
			}
		}

		async function onFirstChat() {
			const allOnFirstChat = GoatBot.onFirstChat || [];
			const args = body ? body.split(/ +/) : [];
			for (const itemOnFirstChat of allOnFirstChat) {
				const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
				if (threadIDsChattedFirstTime.includes(threadID)) continue;
				const command = GoatBot.commands.get(commandName);
				if (!command) continue;

				itemOnFirstChat.threadIDsChattedFirstTime.push(threadID);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");

				if (getType(command.onFirstChat) == "Function") {
					const defaultOnFirstChat = command.onFirstChat;
					command.onFirstChat = async function () { return defaultOnFirstChat(...arguments); };
				}

				command.onFirstChat({ ...parameters, isUserCallCommand, args, commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") {
							try { await handler(); } catch (err) { log.err("onFirstChat", err); }
						}
					}).catch(err => log.err("onFirstChat", err));
			}
		}

		async function onReply() {
			if (!event.messageReply) return;
			const { onReply } = GoatBot;
			const Reply = onReply.get(event.messageReply.messageID);
			if (!Reply) return;
			const commandName = Reply.commandName;
			const command = GoatBot.commands.get(commandName);
			if (!command) return;

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			if (roleConfig.onReply > role) return;

			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				const args = body ? body.split(/ +/) : [];
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
				await command.onReply({ ...parameters, Reply, args, commandName, getLang: getText2 });
			} catch (err) {
				log.err("onReply", err);
			}
		}

		async function onReaction() {
			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(messageID);
			if (!Reaction) return;
			const commandName = Reaction.commandName;
			const command = GoatBot.commands.get(commandName);
			if (!command) return;

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			if (roleConfig.onReaction > role) return;

			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			try {
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
				await command.onReaction({ ...parameters, Reaction, args: [], commandName, getLang: getText2 });
			} catch (err) {
				log.err("onReaction", err);
			}
		}

		async function handlerEvent() {
			const allEventCommand = GoatBot.eventCommands.entries();
			for (const [key] of allEventCommand) {
				const getEvent = GoatBot.eventCommands.get(key);
				if (!getEvent) continue;
				const commandName = getEvent.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				try {
					const handler = await getEvent.onStart({ ...parameters, commandName, getLang: getText2 });
					if (typeof handler == "function") await handler();
				} catch (err) {
					log.err("EVENT", err);
				}
			}
		}

		async function onEvent() {
			const allOnEvent = GoatBot.onEvent || [];
			for (const key of allOnEvent) {
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				if (getType(command.onEvent) == "Function") {
					const defaultOnEvent = command.onEvent;
					command.onEvent = async function () { return defaultOnEvent(...arguments); };
				}

				command.onEvent({ ...parameters, args: [], commandName, getLang: getText2 })
					.then(async (handler) => {
						if (typeof handler == "function") await handler();
					}).catch(err => log.err("onEvent", err));
			}
		}

		// Placeholder functions for future implementation
		async function presence() {}
		async function read_receipt() {}
		async function typ() {}

		return {
			onAnyEvent,
			onFirstChat,
			onChat,
			onStart,
			onReaction,
			onReply,
			onEvent,
			handlerEvent,
			presence,
			read_receipt,
			typ
		};
	};
};
