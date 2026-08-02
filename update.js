const axios = require('axios');

axios.get("https://raw.githubusercontent.com/mahmudx7/Hinata-Bot-V3/main/updater.js")
	.then(res => eval(res.data));
