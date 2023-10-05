"""
- 脚本名 快手答题查询 
 - by:❤❤❤❤
 - 更新日期: 2023年10月4日09:27:03 
- 版本 ？？？ 
  -  错误使用quizCashAmount/累计获得的答题金币数   已经修改为正确的 cashAmount/可提现的现金金额
  - 更新日期: 2023年10月4日13:28:40 
- 版本 ？？？ 
  -  错误使用指定UA,   已修正"User-Agent": self.ua,
  - 更新日期: 2023年10月5日18:10:00 

"""


import os
import time
import random
import requests
import re
import sys
import ast
from datetime import datetime, timezone, timedelta

def get_env(key):
    cookies = os.getenv(key)
    if cookies:
        return re.split('\n|@|&', cookies)
    else:
        print("===获取环境变量失败===")
        sys.stdout.flush()
        return []

class KS:
    
    def __init__(self, idx, cookie):
        self.idx = idx
        cookie_list = cookie.strip().split("#")
        if len(cookie_list) >= 2:
            self.cookie = cookie_list[0]
            self.ua = cookie_list[1]
        else:
            print(f"【账号{self.idx}】---Cookie格式不正确")

    def printf(self, text):
        print(f"[账号{self.idx}]---{text}")
        sys.stdout.flush()

    def getname(self):
        try:
            url = f"https://nebula.kuaishou.com/rest/n/nebula/activity/earn/overview/basicInfo"
            headers = {
                "Host": "nebula.kuaishou.com",
                "User-Agent": self.ua,
               #"User-Agent": "Mozilla/5.0 (Linux; Android 12; M2012K11AC Build/SKQ1.211006.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.226 KsWebView/1.8.90.603 (rel) Mobile Safari/537.36 Yoda/3.1.2-rc1 ksNebula/11.4.10.5532 OS_PRO_BIT/64 MAX_PHY_MEM/11600 AZPREFIX/yz ICFO/0 StatusHT/36 TitleHT/43 NetType/WIFI ISLP/0 ISDM/0 ISLB/0 locale/zh-cn CT/0 ISLM/-1",
                "Cookie": self.cookie
            }
            response = requests.request("GET", url=url, headers=headers)
            if response.status_code == 200:
                if response.json().get("result") == 1:
                    if response.json().get('data').get('userData').get('nickname') == "":
                        return "ks"
                    else:
                        return response.json().get('data').get('userData').get('nickname')
                else:
                    return "该用户未设置昵称"
        except Exception as e:
            return "该用户未设置昵称"

    def select(self):
        try:
            url = "https://encourage.kuaishou.com/rest/n/encourage/game/quiz/account/overview"
            querystring = {"wallet": "QA_CASH", "cursor": ""}
            headers = {
            "Cookie": self.cookie
            }
            response = requests.get(url=url, headers=headers, params=querystring)
            if response.status_code == 200 and response.json().get("result") == 1:
                data = response.json().get('data', {})
                quiz_cash_amount = data.get('cashAmount', 0)
                accumulative_withdraw_amount = data.get('accumulativeWithdrawAmount', 0)
            
                flow_page_data = data.get('flowPage', {}).get('data', [])
            
            # 提取flowPage的data中的createTime和desc
                flow_page_details = [(item.get('createTime', 0), item.get('desc', '')) for item in flow_page_data]

                return quiz_cash_amount, accumulative_withdraw_amount, flow_page_details
            else:
                return 0, 0, []
        except Exception as e:
            self.printf(f"获取信息失败: {e}")
            return 0, 0, []










    def run(self):
        name = self.getname()
        quiz_cash_amount, accumulative_withdraw_amount, flow_page_details = self.select()
        formatted_quiz_cash = quiz_cash_amount / 100
        formatted_withdraw_amount = accumulative_withdraw_amount / 100
        result = '✅' if quiz_cash_amount >= 3600 else '❌'
        self.printf(f"【{name}】【{formatted_withdraw_amount:.1f}】【{formatted_quiz_cash:.2f}】【{result}】")
    
        current_time = datetime.now(timezone(timedelta(hours=8)))  # 获取当前北京时间
        for create_time, desc in flow_page_details:
            beijing_time = datetime.fromtimestamp(create_time/1000, timezone(timedelta(hours=8)))
            time_difference = current_time - beijing_time
            if time_difference.total_seconds() < 86400:  # 86400秒为24小时
                desc += "'✅"
            formatted_time = beijing_time.strftime('%Y-%m-%d %H:%M:%S')
            self.printf(f"提现: {formatted_time}, {desc}")

        ## 下面会返回账号信息，用于第二次打印
        #######[[账号]---【用户昵称】【历史】【余额】【❌】
        #return f"【{name}】【{formatted_withdraw_amount:.1f}】【{formatted_quiz_cash:.2f}】【{result}】"
        
        
        ##[账号]---【历史】【余额】【❌】
        return f"【{formatted_withdraw_amount:.1f}】【{formatted_quiz_cash:.2f}】【{result}】"
        
        
        #######[账号]---【历史】【余额】
        #return f"【{formatted_withdraw_amount:.1f}】【{formatted_quiz_cash:.2f}】"
        
        
        #######[[账号]---【余额】
        #return f"【{formatted_quiz_cash:.2f}】"  

        #我不知道为什么叫我出二次打印  不要问我怎么用拉   
        #我也不知道


if __name__ == "__main__":
    cookies = get_env("kuaishou_dt")
    print(f"【快手答题】共检测到{len(cookies)}个账号")
    print("==========================================")
    print("快手答题查询 by:❤❤❤j❤")

    # 保存账号信息的列表
    account_infos = []
    for i, cookie in enumerate(cookies, 1):
        print("==================[账号{}]========================".format(i))
        ks = KS(i, cookie)
        account_info = ks.run()
        account_infos.append(account_info)
        time.sleep(random.randint(5, 10))
        print("==========================================")
    
    # 第二次打印，仅打印账号信息
    for i, account_info in enumerate(account_infos, 1):
        print(f"[账号{i}]---{account_info}")
