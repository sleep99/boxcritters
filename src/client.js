const { io } = require("socket.io-client");
const getSessionTicket = require("./sessionticket");
const EventEmitter = require("node:events");

class Client extends EventEmitter {
    constructor() {
        super()
        /**
         * if the client is connected to the socket.io server
         */
        this.connected = false;
        /**
         * if the client is logged into an account
         */
        this.loggedIn  = false;
        /**
         * @type {string}
         */
        this.sessionTicket = null;
        /**
         * @type {string}
         */
        this.email = null;
        /**
         * @type {string}
         */
        this.password = null;
        /**
         * player data
         * @type {{ playerId:string, critterId:string, nickname:string, friends:[], ignores:[],
         *  inventory:[], gear:[], eggs:[], coins:number, isMember:boolean }}
         */
        this.user = null;
        /**
         * socket
         */
        this.socket = this.socket = io("https://boxcritters.herokuapp.com/", {
            transports: ["websocket"],
            autoConnect: false,
            extraHeaders: {
                "Host": "boxcritters.herokuapp.com",
                "Origin": "https://boxcritters.com/",
                "User-Agent": "Mozilla/5.0"
            }
        })

        this.socket.onAny((event, ...args) => {
            this.emit(event, ...args);
        })

        this.socket.on("connect", () => {
            this.connected = true;
            this.socket.emit("login", this.sessionTicket);
        })

        this.socket.on("disconnect", () => {
            this.connected = false;
            this.loggedIn  = false;
        })

        this.socket.on("login", (data) => {
            this.user = data;
            this.loggedIn = true;
            this.user = data;
        })

        this.socket.on("updateCoins", (data) => {
            this.user.coins = data.balance;
        })
    }

    /**
     * login and connect to the server
     * @param {string} email account email
     * @param {string} password account password
     * @returns {Promise<string>} session ticket
     */
    login(email, password) {
        return new Promise((resolve, reject) => {
            this.email = email;
            this.password = password;

            getSessionTicket(email, password)
            .catch(reject)
            .then((ticket) => {
                this.sessionTicket = ticket;
                this.socket.connect();
                resolve(ticket);
            })
        })
    }

    /**
     * emit an event to the socket.io server
     * @param {string} event event name
     * @param  {...any} args data
     */
    send(event, ...args) {
        this.socket.emit(event, ...args)
    }

    /**
     * 
     * @param {"port"|"shack"|"jungle"} room 
     * @returns {Promise<{roomId:string, playerCrumbs:[]}>} info of players in room
     */
    joinRoom(room) {
        return new Promise((resolve, reject) => {
            this.send("joinRoom", room);
            this.once("joinRoom", resolve);
        })
    }

    /**
     * move
     * @param {number} x x coordinate
     * @param {number} y y coordinate
     */
    move(x, y) {
        this.send("moveTo", x, y);
    }

    /**
     * send a message
     * @param {string} content 
     */
    message(content) {
        this.send("message", content);
    }

    /**
     * get the weekly shop
     * @returns {Promise<{freeItem:string,lastItem:string,nextItem:string,collection:Array<string>}>}
     */
    getShop() {
        return new Promise((resolve, reject) => {
            this.send("getShop")
            this.once("getShop", resolve);
            setTimeout(() => reject("could not get shop"), 10000);
        })
    }


    /**
     * buy an item from the weekly shop
     * @param {string} item item name
     * @returns {Promise<{itemId:string,cost:number,balance:number}>}
     */
    buyItem(item) {
        return new Promise((resolve, reject) => {
            this.send("buyItem", item)
            this.once("buyItem", resolve);
            setTimeout(() => reject("could not buy item"), 10000);
        })
    }

    /**
     * redeem an item code
     * @param {string} code code
     * @returns {Promise<{itemId:string}>}
     */
    redeem(code) {
        return new Promise((resolve, reject) => {
            this.send("code", code, "");
            this.once("buyItem", resolve);
            setTimeout(() => reject("could not redeem code"), 10000);
        })
    }

    /**
     * disconnect the socket
     */
    disconnect() {
        this.socket.disconnect();
    }
}

module.exports = Client;