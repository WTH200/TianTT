/*
快手答题              ks_dt.js
cron: 0 14 9-19 * * *
const $ = new Env("KS答题");

-------------------  青龙-配置文件-复制区域  -------------------
# 快手答题
export kuaishou_dt="全部cookie#ua"

-------------------  青龙-配置文件-说明区域  -------------------

多账号用 换行 或 @ 或 & 分割
抓 https://encourage.kuaishou.com域名下的 cookie和ua

*/

const axios = require("axios");
const $ = Env("KS答题"),
    envSplit = ["\n", "&", "@"],
    ckNames = ["kuaishou_dt"];

require("dotenv").config();

if (!process.env.kuaishou_dt) {
    console.log("=========未检测到变量,请填写[kuaishou_dt]变量=========");
    process.exit(0);
}

class UserClass {
    constructor(Z) {
        this.idx = "账号[" + ++$.userIdx + "]";
        this.ckFlog = true;
        this.ck_ = Z.split("#");
        this.ck = this.ck_[0];
        this.ua = this.ck_[1];
        this.ts13 = $.ts(13);
        this.hd = {
            "Host": "encourage.kuaishou.com",
            "User-Agent": this.ua,
            "X-Requested-With": "com.kuaishou.nebula",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Dest": "empty",
            "Cookie": this.ck,
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
        };
    }

    async ["userTask"]() {
        console.log("\n=============== " + this.idx + " ===============");
        if (this.ckFlog) {
            $.log("\n-------------- 开始答题 --------------");
        }
        await this.start_dt();
    }

    async ["tips"]() {
        $.log("By: 北渡\nQQ交流群：806316899");
    }

    async ["cash"]() {
        try {
            const url = "https://encourage.kuaishou.com/rest/n/encourage/game/quiz/account/overview?wallet=QA_CASH&cursor=&__NS_sig3=e1f1b686915d0a5c37bd3abeb9b82529a9bdd5e81a4e29a3df53aeaea8a8abaa95b5&sigCatVer=1";

            const headers = {
                "Host": "encourage.kuaishou.com",
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "Cookie": this.ck,
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": this.ua,
                "Accept-Language": "zh-CN,zh-Hans;q=0.9",
                "Accept-Encoding": "gzip, deflate, br"
            };

            const response = await axios.get(url, { headers });

            if (response.status === 200) {
                const cash = response.data.data.quizCashAmount;
                $.log(this.idx + ":当前金币余额为:" + cash);
                return cash;
            } else {
                console.log(response.data);
                return 0;
            }
        } catch (error) {
            console.log(error);
            return 0;
        }
    }




    async ["start_dt"]() {
        let y = {
                "fn": "开始答题",
                "method": "get",
                "url": "https://encourage.kuaishou.com/rest/n/encourage/game/quiz/round/kickoff?reKickoff=false&sigCatVer=1",
                "headers": this.hd
            },
            A = await $.request(y);

        if (A.result == 1 && A.data.roundId) {
            this.roundId = A.data.roundId;
            this.questionDetail = A.data.questionDetail;
            this.question = A.data.questionDetail.question;
            this.opt = A.data.questionDetail.options;
            this.index = A.data.questionDetail.index;
            this.total = A.data.questionDetail.total;
            await this.next(this.index, this.question, this.opt, this.roundId);
            this.ckFlog = true;
        } else {
            if (A.result == 103703) {
                $.log(this.idx + ": " + "开始答题" + " -- " + A.error_msg);
            } else {
                console.log("开始答题: 失败,  " + JSON.stringify(A));
                this.ckFlog = false;
            }
        }
    }

    async ["upload"](Z, y, A, o, m, U, t = "gpt") {
        let C = {
                "fn": "结果",
                "method": "post",
                "url": "https://encourage.kuaishou.com/rest/n/encourage/game/quiz/round/answer/upload?sigCatVer=1",
                "headers": {
                    "Host": "encourage.kuaishou.com",
                    "User-Agent": this.ua,
                    "Accept": "*/*",
                    "Origin": "https://encourage.kuaishou.com",
                    "X-Requested-With": "com.kuaishou.nebula",
                    "Sec-Fetch-Site": "same-origin",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Dest": "empty",
                    "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Cookie": this.ck,
                    "content-type": "application/json"
                },
                "json": {
                    "roundId": A,
                    "index": o,
                    "answer": U
                }
            },
            z = await $.request(C);

        if (t == "gpt") {
            if (z.result == 1 && z.data.answerDetail.correct) {
                if (o == 9) {
                    await this.up_qs(Z, y, A, m);
                    $.log(this.idx + ": 恭喜你个狗子, 10 道题全对了, 当前金币:" + z.data.amount.current, {
                        "notify": true
                    });
                } else {
                    this.roundId = z.data.nextQuestionDetail.roundId;
                    this.questionDetail = z.data.nextQuestionDetail.questionDetail;
                    this.question = z.data.nextQuestionDetail.questionDetail.question;
                    this.opt = z.data.nextQuestionDetail.questionDetail.options;
                    this.index = z.data.nextQuestionDetail.questionDetail.index;
                    await this.up_qs(Z, y, A, m);
                    $.log(this.idx + ": " + C.fn + " 第 " + (o + 1) + " 题 -- 回答正确, 上传服务器题库, 当前金币:" + z.data.amount.current);
                    await this.next(this.index, this.question, this.opt, this.roundId);
                }
            } else {
                if (z.result == 1 && z.data.answerDetail.correct == false) {
                    $.log(this.idx + ":  第 " + (o + 1) + " 题 -- 回答错误, 已经将正确答案上传服务器题库, 下次就不会错了鸭!");
                    await this.up_qs(Z, y, A, z.data.answerDetail.correctAnswer);
                    console.log(JSON.stringify(z));
                } else {
                    console.log(C.fn + ": 失败, " + JSON.stringify(C) + " " + JSON.stringify(z));
                }
            }
        } else {
            if (t == "database") {
                if (z.result == 1 && z.data.answerDetail.correct) {
                    o == 9 ? $.log(this.idx + ": 恭喜你个狗子, 10 道题全对了, 当前金币:" + z.data.amount.current, {
                        "notify": true
                    }) : (this.roundId = z.data.nextQuestionDetail.roundId, this.questionDetail = z.data.nextQuestionDetail.questionDetail, this.question = z.data.nextQuestionDetail.questionDetail.question, this.opt = z.data.nextQuestionDetail.questionDetail.options, this.index = z.data.nextQuestionDetail.questionDetail.index, $.log(this.idx + ": " + C.fn + " 第 " + (o + 1) + " 题 -- 回答正确, 当前金币:" + z.data.amount.current), await this.next(this.index, this.question, this.opt, this.roundId));
                } else {
                    if (z.result == 1 && z.data.answerDetail.correct == false) {
                        $.log(this.idx + ":  第 " + (o + 1) + " 题 -- 回答错误, 请检查数据库答案");
                        console.log(JSON.stringify(z));
                    } else {
                        console.log(C.fn + ": 失败, " + JSON.stringify(C) + " " + JSON.stringify(z));
                    }
                }
            }
        }
    }

    async ["next"](Z, y, A, o) {
        $.log("\n\n\n" + this.idx + ":  第 " + (Z + 1) + " 题, 问题:" + y + " -- 选项:[" + this.opt + "]");
        $.log(this.idx + ": 开始查询数据库...");
        let U = await this.checkDatabase(y, A);

        if (U) {
            if (A.indexOf(U.answer) > -1) {
                let t = A.indexOf(U.answer),
                    Y = U.answer;
                await $.wait($.randomInt(3, 5));
                await this.upload(y, A, o, Z, Y, t, "database");
            } else {
                try {
                    $.log(this.idx + ": gpt 时间...");
                    let C = await this.to_gpt(y, A),
                        z = C.index,
                        k = C.answer;
                    await this.upload(y, A, o, Z, k, z, "gpt");
                } catch (W) {
                    console.log(W);
                }
            }
        } else {
            $.log(this.idx + ": 开始查询备用数据库...");
            let P = await this.checkDatabase_2(y, A);

            if (P && A.indexOf(P) > -1) {
                let S = A.indexOf(P),
                    G = P;
                await $.wait($.randomInt(3, 5));
                await this.upload(y, A, o, Z, G, S, "gpt");
            } else {
                try {
                    $.log(this.idx + ": gpt 时间...");
                    let q = await this.to_gpt(y, A),
                        e = q.index,
                        w = q.answer;
                    await this.upload(y, A, o, Z, w, e, "gpt");
                } catch (l) {
                    console.log(l);
                }
            }
        }
    }

    async ["to_gpt"](Z, y) {
        let o = "你是一个答题机器人,我会给你题目以及选项,你直接回答正确答案的即可,  需回答题目: " + Z + ",  题目选项:" + y + ";请返回我正确答案;使用以下json字符串格式返回:{answer:xxxxx}";

        try {
            let m = await this.gpt(o);

            if (typeof m == "object") {
                let U = m.answer;

                if (y.includes(U)) {
                    const answer_index = y.indexOf(U);
                    console.log("gpt 选择答案: 本次选择 " + answer_index + "--" + U);
                    console.log({
                        "index": answer_index,
                        "answer": U
                    });
                    return {
                        "index": answer_index,
                        "answer": U
                    };
                } else {
                    let t = $.randomInt(0, 3);
                    console.log("gpt 不行了 开始随机答案: 本次选择" + t);
                    return {
                        "index": t,
                        "answer": y[t]
                    };
                }
            } else {
                if (typeof m == "string") {
                    function Y(C) {
                        const z = /"answer".*:.*"(.*)"/gm,
                            k = C.match(z);

                        if (k) {
                            const W = k[0];
                            return "{" + W + "}";
                        } else {
                            return false;
                        }
                    }

                    if (Y(m)) {
                        let C = JSON.parse(Y(m)),
                            z = C.answer;

                        if (y.includes(z)) {
                            let k = y.indexOf(z);
                            console.log("gpt 选择答案: 本次选择 " + k + "--" + z);
                            console.log({
                                "index": k,
                                "answer": z
                            });
                            return {
                                "index": k,
                                "answer": z
                            };
                        } else {
                            let W = $.randomInt(0, 3);
                            console.log("gpt 不行了 开始随机答案: 本次选择" + W);
                            return {
                                "index": W,
                                "answer": y[W]
                            };
                        }
                    } else {
                        for (let P of y) {
                            function S(q, e) {
                                return e.includes(q);
                            }

                            let G = S(P, m);

                            if (G) {
                                let q = P,
                                    e = y.indexOf(q);
                                console.log("gpt 选择答案: 本次选择 " + e + "--" + q);
                                console.log({
                                    "index": e,
                                    "answer": q
                                });
                                return {
                                    "index": e,
                                    "answer": q
                                };
                            } else {
                                let w = $.randomInt(0, 3);
                                console.log("gpt 不行了 --2 开始随机答案: 本次选择 " + w);
                                return {
                                    "index": w,
                                    "answer": y[w]
                                };
                            }
                        }
                    }
                } else {
                    if (m == undefined) {
                        let l = $.randomInt(0, 3);
                        console.log("gpt 不行了 --3 开始随机答案: 本次选择" + l);
                        return {
                            "index": l,
                            "answer": y[l]
                        };
                    } else {
                        let O = $.randomInt(0, 3);
                        console.log("gpt 不行了 --4 开始随机答案: 本次选择" + O);
                        return {
                            "index": O,
                            "answer": y[O]
                        };
                    }
                }
            }
        } catch (x) {
            console.log(x);
        }
    }

    async ["checkDatabase"](Z) {
        const encodedQuestion = encodeURIComponent(Z);
        const url = `http://tk.mzkj666.cn/answer?question=${encodedQuestion}`;

        try {
            const response = await axios.get(url);

            if (response.status === 200 && response.data.code === 200) {
                console.log(this.idx + ": " + this.question + "答案查询成功！");
                return response.data.data;
            } else {
                console.log(this.idx + ": " + this.question + response.data.message);
                return false;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async ["checkDatabase_2"](_0x295cc9, _0x2ca413) {
        let _0x115303 = _0x295cc9.replace("？", "?");

        const _0x354f28 = {
            "method": "post",
            "url": "https://csss.kanshangni.cn/duquAA.php",
            "headers": {
                "User-Agent": "test",
                "Host": "csss.kanshangni.cn",
                "Connection": "Keep-Alive",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            "form": {
                "timu": _0x115303
            }
        };

        let _0x2bec4d = await $.request(_0x354f28);

        console.log(_0x2bec4d);
        if (_0x2bec4d) return $.log(this.idx + ": " + _0x295cc9 + " 数据库2查询成功！"), _0x2bec4d;else console.log(_0x354f28.fn + ": 失败,  " + JSON.stringify(_0x2bec4d));
    }

    async ["up_qs"](Z, y, A, o) {
        const options = {
            method: "post",
            url: `http://tk.mzkj666.cn/upload`,
            headers: {
                "Content-Type": "application/json"
            },
            json: {
                question: Z,
                options: y,
                answer: o,
                roundId: A
            }
        };
        let t = await $.request(options);

        if (t.status === 200) {
            console.log(this.idx + ": " + Z + " -- [" + y + "]; 答案:" + o + " " + t.data);
        } else {
            if (t.status === 500) {
                console.log(this.idx + ": " + t.data);
            } else {
                console.log("题目上传失败: " + JSON.stringify(t));
            }
        }
    }

    async ["gpt"](Z) {
        const A = require("got"),
            o = {
                "method": "post",
                "url": "https://www.gaosijiaoyu.cn/message",
                "headers": {
                    "Accept": "*/*",
                    "Accept-Language": "zh-CN,zh;q=0.9,fr;q=0.8,de;q=0.7,en;q=0.6",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Origin": "https://www.zaiwen.top",
                    "Pragma": "no-cache",
                    "Referer": "https://www.zaiwen.top/",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "cross-site",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    "sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "Content-Type": "application/json"
                },
                "json": {
                    "message": [{
                        "role": "user",
                        "content": Z
                    }],
                    "mode": "v3.5",
                    "key": null
                },
                "timeout": 10000
            };

        try {
            const m = await A(o);
            return m.body;
        } catch (U) {
            console.error("请求出错：", U.message);
        }
    }

}

!(async () => {
    if ($.read_env(UserClass)) {
        await $.userList[0].tips();

        for (let Z of $.userList) {
            await Z.userTask();
        }
    }
})().catch(Z => console.log(Z)).finally(() => $.exitNow());

function Env(Z) {
    return new class {
        constructor(A) {
            this.name = A;
            this.startTime = Date.now();
            this.log("[" + this.name + "]开始运行");
            this.notifyStr = [];
            this.notifyFlag = true;
            this.userIdx = 0;
            this.userList = [];
            this.userCount = 0;
        }

        async ["request"](A, o = "body") {
            try {
                const m = require("got");

                let U = 8000,
                    t = 1,
                    Y = null,
                    C = 0,
                    z = A.fn || A.url;
                A.timeout = A.timeout || U;
                A.retry = A.retry || {
                    "limit": 0
                };
                A.method = A?.["method"]?.["toUpperCase"]() || "GET";

                while (C++ < t) {
                    try {
                        Y = await m(A);
                        break;
                    } catch (S) {
                        S.name == "TimeoutError" ? this.log("请求超时，重试第" + C + "次") : this.log("");
                    }
                }

                if (Y == null) {
                    return Promise.resolve({
                        "statusCode": "timeout",
                        "headers": null,
                        "body": null
                    });
                }

                let {
                    statusCode: k,
                    headers: W,
                    body: P
                } = Y;

                if (P) {
                    try {
                        P = JSON.parse(P);
                    } catch {}
                }

                if (o == "body") {
                    return Promise.resolve(P);
                } else {
                    if (o == "cookie") {
                        return Promise.resolve(Y);
                    } else {
                        if (o == "hd") {
                            return Promise.resolve(W);
                        } else {
                            if (o == "all") {
                                return Promise.resolve([W, P]);
                            } else {
                                if (o == "statusCode") {
                                    return Promise.resolve(k);
                                }
                            }
                        }
                    }
                }
            } catch (G) {
                console.log(G);
            }
        }

        ["log"](A, o = {}) {
            typeof A == "object" && (A = JSON.stringify(A));
            let m = {
                "console": true
            };
            Object.assign(m, o);

            if (m.time) {
                let U = m.fmt || "hh:mm:ss";
                A = "[" + this.time(U) + "]" + A;
            }

            m.notify && this.notifyStr.push(A);
            m.console && console.log(A);
        }

        ["read_env"](A) {
            require("dotenv").config();

            let o = ckNames.map(m => process.env[m]);

            for (let m of o.filter(U => !!U)) {
                let U = envSplit.filter(Y => m.includes(Y)),
                    t = U.length > 0 ? U[0] : envSplit[0];

                for (let Y of m.split(t).filter(C => !!C)) {
                    this.userList.push(new A(Y));
                }
            }

            this.userCount = this.userList.length;

            if (!this.userCount) {
                this.log("未找到变量，请检查变量" + ckNames.map(C => "[" + C + "]").join("或"), {
                    "notify": true
                });
                return false;
            }

            this.log("共找到" + this.userCount + "个账号");
            return true;
        }

        ["time"](A, o = null) {
            let m = o ? new Date(o) : new Date(),
                U = {
                    "M+": m.getMonth() + 1,
                    "d+": m.getDate(),
                    "h+": m.getHours(),
                    "m+": m.getMinutes(),
                    "s+": m.getSeconds(),
                    "q+": Math.floor((m.getMonth() + 3) / 3),
                    "S": this.padStr(m.getMilliseconds(), 3)
                };
            /(y+)/.test(A) && (A = A.replace(RegExp.$1, (m.getFullYear() + "").substr(4 - RegExp.$1.length)));

            for (let Y in U) new RegExp("(" + Y + ")").test(A) && (A = A.replace(RegExp.$1, 1 == RegExp.$1.length ? U[Y] : ("00" + U[Y]).substr(("" + U[Y]).length)));

            return A;
        }

        async ["showmsg"]() {
            if (!this.notifyFlag) {
                return;
            }

            if (!this.notifyStr) {
                return;
            }

            if (!this.notifyStr.length) {
                return;
            }

            let A = require("./sendNotify");

            this.log("\n============== 本次推送--By: 北渡科技 ==============");
            await A.sendNotify(this.name, this.notifyStr.join("\n"));
        }

        ["padStr"](A, o, m = {}) {
            let U = m.padding || "0",
                t = m.mode || "l",
                Y = String(A),
                C = o > Y.length ? o - Y.length : 0,
                z = "";

            for (let k = 0; k < C; k++) {
                z += U;
            }

            t == "r" ? Y = Y + z : Y = z + Y;
            return Y;
        }

        ["json2str"](A, o, m = false) {
            let U = [];

            for (let t of Object.keys(A).sort()) {
                let Y = A[t];

                if (Y && m) {
                    Y = encodeURIComponent(Y);
                }

                U.push(t + "=" + Y);
            }

            return U.join(o);
        }

        ["str2json"](A, o = false) {
            let m = {
                "Y": C
            };

            for (let U of A.split("&")) {
                if (!U) {
                    continue;
                }

                let t = U.indexOf("=");

                if (t == -1) {
                    continue;
                }

                let C = U.substr(t + 1);

                if (o) {
                    C = decodeURIComponent(C);
                }
            }

            return m;
        }

        ["phoneNum"](A) {
            if (A.length == 11) {
                let o = A.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
                return o;
            } else {
                return A;
            }
        }

        ["randomInt"](A, o) {
            return Math.round(Math.random() * (o - A) + A);
        }

        async ["yiyan"]() {
            const A = require("got");

            return new Promise(o => {
                (async () => {
                    try {
                        const U = await A("https://v1.hitokoto.cn");
                        let t = JSON.parse(U.body),
                            Y = "[一言]: " + t.hitokoto + "  by--" + t.from;
                        o(Y);
                    } catch (C) {
                        console.log(C.res.body);
                    }
                })();
            });
        }

        ["ts"](A = false, o = "") {
            let m = new Date(),
                U = "";

            switch (A) {
                case 10:
                    U = Math.round(new Date().getTime() / 1000).toString();
                    break;

                case 13:
                    U = Math.round(new Date().getTime()).toString();
                    break;

                case "h":
                    U = m.getHours();
                    break;

                case "m":
                    U = m.getMinutes();
                    break;

                case "y":
                    U = m.getFullYear();
                    break;

                case "h":
                    U = m.getHours();
                    break;

                case "mo":
                    U = m.getMonth();
                    break;

                case "d":
                    U = m.getDate();
                    break;

                case "ts2Data":
                    if (o != "") {
                        const time = o;

                        if (time.toString().length == 13) {
                            let t = new Date(time + 28800000);
                            U = t.toJSON().substr(0, 19).replace("T", " ");
                        } else {
                            if (time.toString().length == 10) {
                                const time = time * 1000;
                                let Y = new Date(time + 28800000);
                                U = Y.toJSON().substr(0, 19).replace("T", " ");
                            }
                        }
                    }

                    break;

                default:
                    U = "未知错误,请检查";
                    break;
            }

            return U;
        }

        ["randomPattern"](A, o = "abcdef0123456789") {
            let m = "";

            for (let U of A) {
                if (U == "x") {
                    m += o.charAt(Math.floor(Math.random() * o.length));
                } else {
                    U == "X" ? m += o.charAt(Math.floor(Math.random() * o.length)).toUpperCase() : m += U;
                }
            }

            return m;
        }

        ["randomString"](A, o = "abcdef0123456789") {
            let m = "";

            for (let U = 0; U < A; U++) {
                m += o.charAt(Math.floor(Math.random() * o.length));
            }

            return m;
        }

        ["randomList"](A) {
            let o = Math.floor(Math.random() * A.length);
            return A[o];
        }

        ["wait"](A) {
            $.log("随机等待 " + A + " 秒 ...");
            return new Promise(o => setTimeout(o, A * 1000));
        }

        async ["exitNow"]() {
            await this.showmsg();
            let A = Date.now(),
                o = (A - this.startTime) / 1000;
            this.log("[" + this.name + "]运行结束，共运行了" + o + "秒");
            process.exit(0);
        }

    }(Z);
}
