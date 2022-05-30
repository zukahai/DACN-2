from kivymd.uix.screen import MDScreen
from kivymd.app import MDApp
from kivymd.uix.list import MDList, OneLineListItem, TwoLineListItem
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.toolbar import MDToolbar
from kivymd.uix.dialog import MDDialog
from kivymd.app import MDApp
from kivy.uix.scrollview import ScrollView
from googletrans import Translator
import os
import bs4
import pyautogui
import playsound
from kivy.core.window import Window
from win10toast import ToastNotifier
import speech_recognition as sr
import time
import datetime
import json
import re
import webbrowser
import numpy as np
import tensorflow as tf
import tflearn
import random
import json
import pickle
import requests
import urllib
import urllib.request as urllib2
from time import strftime
from gtts import gTTS
from youtube_search import YoutubeSearch
from bs4 import BeautifulSoup
import nltk
from nltk.stem.lancaster import LancasterStemmer
language = 'vi'
alone = 'Câu này hỏi khó quá đi, Người yêu đâu phải muốn thì có luôn. Kể ra lại thấy thêm buồn, Bận làm trợ lý alone dài dài haha'
like = 'Tôi thích tìm kiếm thông tin và giúp đỡ mọi người'
toast = ToastNotifier()
stemmer = LancasterStemmer()
translator = Translator()
# load model and data
data = pickle.load(open("training_data", "rb"))
words = data['words']
classes = data['classes']
train_x = data['train_x']
train_y = data['train_y']
net = tflearn.input_data(shape=[None, len(train_x[0])])
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, len(train_y[0]), activation='softmax')
net = tflearn.regression(net)

model = tflearn.DNN(net, tensorboard_dir='tflearn_logs')
model.load('Model/model.tflearn')
with open('Data/intents.json', encoding='utf8') as json_data:
    intents = json.load(json_data)

# làm sach câu


def clean_up_sentence(sentence):
    # It Tokenize or Break it into the constituents parts of Sentense.
    sentence_words = nltk.word_tokenize(sentence)
    # Stemming means to find the root of the word.
    sentence_words = [stemmer.stem(word.lower()) for word in sentence_words]
    return sentence_words

# Return the Array of Bag of Words: True or False and 0 or 1 for each word of bag that exists in the Sentence


def bow(sentence, words, show_details=False):
    sentence_words = clean_up_sentence(sentence)
    bag = [0]*len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
                if show_details:
                    print("found in bag: %s" % w)
    return(np.array(bag))


ERROR_THRESHOLD = 0.25
print("ERROR_THRESHOLD = 0.25")


def classify(sentence):
    # Prediction or To Get the Posibility or Probability from the Model
    results = model.predict([bow(sentence, words)])[0]
    # Exclude those results which are Below Threshold
    results = [[i, r] for i, r in enumerate(results) if r > ERROR_THRESHOLD]
    # Sorting is Done because heigher Confidence Answer comes first.
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        # Tuppl -> Intent and Probability
        return_list.append((classes[r[0]], r[1]))
    return return_list


def response(sentence, userID='123', show_details=False):
    results = classify(sentence)
    # That Means if Classification is Done then Find the Matching Tag.
    if results:
        # Long Loop to get the Result.
        while results:
            for i in intents['intents']:
                if results[0][1] > 0.9:
                    if i['tag'] == results[0][0]:
                        # Random Response from High Order Probabilities
                        return random.choice(i['responses'])
                # Tag Finding
            results.pop(0)


def current_weather(text):
    reg_ex = re.search('ở (.+)', text)
    domain = reg_ex.group(1)
    ow_url = "http://api.openweathermap.org/data/2.5/weather?"
    city = domain
    if not city:
        pass
    api_key = "fe8d8c65cf345889139d8e545f57819a"
    call_url = ow_url + "appid=" + api_key + "&q=" + city + "&units=metric"
    response = requests.get(call_url)
    data = response.json()
    if data["cod"] != "404":
        city_res = data["main"]
        current_temperature = city_res["temp"]
        current_pressure = city_res["pressure"]
        current_humidity = city_res["humidity"]
        suntime = data["sys"]
        sunrise = datetime.datetime.fromtimestamp(suntime["sunrise"])
        sunset = datetime.datetime.fromtimestamp(suntime["sunset"])
        wthr = data["weather"]
        weather_description = wthr[0]["description"]
        now = datetime.datetime.now()
        content = """
        Hôm nay là ngày {day} tháng {month} năm {year}
        Mặt trời mọc vào {hourrise} giờ {minrise} phút
        Mặt trời lặn vào {hourset} giờ {minset} phút
        Nhiệt độ trung bình là {temp} độ C
        Áp suất không khí là {pressure} héc tơ Pascal
        Độ ẩm là {humidity}%
        Trời hôm nay quang mây. Dự báo mưa rải rác ở một số nơi.""".format(day=now.day, month=now.month, year=now.year, hourrise=sunrise.hour, minrise=sunrise.minute,
                                                                           hourset=sunset.hour, minset=sunset.minute,
                                                                           temp=current_temperature, pressure=current_pressure, humidity=current_humidity)
        speak(content)
        return(content)
        time.sleep(20)
    else:
        speak("Không tìm thấy địa chỉ của bạn")


def covid_api(text):
    text = text.lower()
    if 'tại' in text:
        reg_ex = re.search('tại (.+)', text)
        country = reg_ex.group(1)
    elif 'ở' in text:
        reg_ex = re.search('ở (.+)', text)
        country = reg_ex.group(1)
    if len(country) > 0:
        if 'anh' in text:
            country = 'uk'
        elif 'mỹ' in text or 'hoa kỳ' in text or 'usa' in text:
            country = 'us'
        elif 'việt' in text or 'việt nam' in text or 'viet' in text:
            country = 'viet-nam'
        else:
            translator = Translator()
            translated = translator.translate('nước '+country, dest='en')
            country = translated.text
        country = country.lower()
        try:
            url = 'https://www.worldometers.info/coronavirus/country/' + country + '/'
            html_data = data = requests.get(url)
            bs = bs4.BeautifulSoup(html_data.text, 'html.parser')
            data = []
            data_ = ''
            info_div = bs.find(
                'div', class_='content-inner').findAll('div', id='maincounter-wrap')
            for s in info_div:
                s = s.find("span", class_=None)
                clean = re.compile('<.*?>')
                s = re.sub(clean, '', str(s))
                s = s.replace(',', '.')
                data.append(s)
            header = ['Số ca mắc: ', 'Ca tử vong: ', 'Ca chữa khỏi: ']
            for i in range(len(header)):
                data_ = data_+header[i]+data[i]+', \n'
            speak(data_)
            return(data_)
        except:
            url = 'https://www.worldometers.info/coronavirus/'
            html_data = data = requests.get(url)
            bs = bs4.BeautifulSoup(html_data.text, 'html.parser')
            data = []
            data_ = ''
            info_div = bs.find(
                'div', class_='content-inner').findAll('div', id='maincounter-wrap')
            for s in info_div:
                s = s.find("span", class_=None)
                clean = re.compile('<.*?>')
                s = re.sub(clean, '', str(s))
                s = s.replace(',', '.')
                data.append(s)
            header = ['Số ca mắc: ', 'Ca tử vong: ', 'Ca chữa khỏi: ']
            for i in range(len(header)):
                data_ = data_+header[i]+data[i]+', \n'
            speak(data_)
            return(data_)
    else:
        s = 'Không có kết quả'
        speak(s)
        return s


def get_text():
    for i in range(3):
        print('Nói đi')
        text = get_voice()
        if(text):
            return text.lower()
        elif i < 2:
            speak("Tôi không nghe rõ, bạn có thể nói lại không")
    time.sleep(10)
    stop()
    return 0


def talk(name):
    day_time = int(strftime("%H"))
    if day_time < 12:
        hi = "Chào buổi sáng {}. Chúc bạn ngày mới tốt lành!".format(name)
        speak(hi)
        return hi
    elif day_time < 18:
        hi = "Chào buổi chiều {}".format(name)
        speak(hi)
        return hi
    else:
        hi = "Chào buổi tối {}".format(name)
        speak(hi)
        return hi
    time.sleep(5)


def open_application(text):
    if "microsoft edge" in text:
        speak("Mở Microsoft Edge")
        os.startfile(
            'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
        time.sleep(3)
        speak("Đã Mở Microsoft Edge")
        time.sleep(3)
        return 'Đã Mở Microsoft Edge'

    elif "google" in text:
        speak("Mở Google Chrome")
        os.startfile('C:\Program Files\Google\Chrome\Application\chrome.exe')
        time.sleep(3)
        speak("Đã mở Google Chrome")
        time.sleep(3)
        return 'Đã mở Google Chrome'

    elif "font" in text:
        speak("Mở Font Lab")
        os.startfile('C:\Program Files\Fontlab\FontLab 7\FontLab 7.exe')
        time.sleep(3)
        speak("Đã mở Font Lab")
        time.sleep(3)
        return 'Đã mở FontLab'
    elif "word" in text:
        speak("Mở Microsoft Word")
        os.startfile(
            'C:\Program Files\Microsoft Office\\root\Office16\WINWORD.EXE')
        time.sleep(3)
        speak("Đã mở Microsoft Word")
        time.sleep(3)
        return("Đã mở Microsoft Word")
    elif "excel" in text:
        speak("Mở Microsoft Excel")
        os.startfile(
            'C:\Program Files\Microsoft Office\\root\Office16\EXCEL.EXE')
        time.sleep(3)
        speak("Đã mở Microsoft Excel")
        time.sleep(3)
        return 'Đã mở Microsoft Excel'
    elif "cài đặt" in text or 'setting' in text:
        speak("Mở Cài Đặt")
        os.popen("start ms-settings:")
        time.sleep(3)
        speak("Đã mở Cài đặt")
        time.sleep(3)
        return 'Đã mở Cài đặt'
    elif "điều khiển" in text or 'Control' in text:
        speak("Mở Trình điều khiển")
        os.popen("control panel")
        time.sleep(3)
        speak("Đã mở trình điều khiển")
        time.sleep(3)
        return 'Đã mở Trình điều khiển'
    else:
        speak("Ứng dụng chưa được cài đặt. Bạn hãy thử lại!")
        time.sleep(3)
        return 'Ứng dụng chưa được cài đặt. Bạn hãy thử lại!'


def help():
    time.sleep(3)
    speak("Bạn cần Tôi giúp gì không?")
    time.sleep(3)
    return'Bạn cần Tôi giúp gì không?'


def get_name():
    f = open('Data/name.txt', 'r', encoding='UTF-8')
    name = f.read()
    name = name.capitalize()
    return name


def change_name(text):
    reg_ex = re.search('là (.+)', text)
    name = reg_ex.group(1)
    f = open('Data/name.txt', 'w', encoding="utf8")
    f.write(name)
    s = 'Tôi sẽ gọi bạn là ' + name
    speak(s)
    return s


def call_bot(text):
    text = text.lower()
    answer = response(text)
    answer = str(answer)
    print("Bạn: " + text)
    if answer == "1":
        s = 'Chào bạn '+get_name() + ' tôi có thể giúp gì cho bạn'
        speak(s)
        return s
    elif answer == "2":
        s = "Hẹn gặp lại bạn nhé"
        speak(s)
        return s
    elif answer == "3":
        s = 'Ngại quá, Tôi rất vui khi giúp được bạn'
        speak(s)
        time.sleep(3)
        return s
    elif answer == "4":
        s = 'Tôi lúc nào cũng khỏe, trừ khi mất điện mà thôi hì hì'
        speak(s)
        time.sleep(3)
        return s
    elif answer == "5":
        s = 'Tên tôi là trợ lý VKU'
        speak(s)
        time.sleep(3)
        return s
    elif answer == "6":
        s = 'Thế giới rất có nhiều người nhưng bạn luôn là nhất !'
        speak(s)
        time.sleep(3)
        return s
    elif answer == "7":
        s = 'Buồn quá, bạn nên nghỉ ngơi đi nhé !'
        speak(s)
        time.sleep(3)
        return s
    elif answer == "8":
        s = 'Tôi được tạo ra bởi nhóm NC siêu cấp vip pro'
        speak(s)
        time.sleep(3)
        return s
    elif answer == "9":
        s = 'Bạn tên là ' + get_name()
        speak(s)
        time.sleep(3)
        return s
    elif answer == "10":
        speak(alone)
        time.sleep(3)
        return alone
    elif answer == "11":
        speak(like)
        time.sleep(3)
        return like
    elif answer == "12":
        s = gold_price()
        speak(s)
        return s
    elif "covid tại" in text or "corona tại" in text or 'covid19 tại' in text or 'số ca covid' in text:
        return covid_api(text)
    elif "trò chuyện" in text or "nói chuyện" in text:
        return talk(get_name())
    # elif "dịch từ" in text or "dịch nội dung" in text or 'dịch chữ':
    #     return translate(text)
    elif "âm lượng" in text:
        return change_volume(text)
    elif "gọi tôi là" in text or 'tên tôi là' in text:
        return change_name(text)
    elif "thời tiết ở" in text:
        return current_weather(text)
    elif "ứng dụng" in text:
        return open_application(text)
    elif "tên tôi" in text or "tôi tên" in text:
        return get_name()
    elif "trang web" in text:
        return open_website(text)
        time.sleep(4)
    elif "giá vàng" in text:
        s = gold_price()
        speak(s)
        # toast.show_toast("Giá vàng",s)
        return s
    elif "tìm kiếm" in text:
        return open_website_search(text)
        time.sleep(4)
    elif "hiện tại là" in text:
        s = get_time(text)
        # toast.show_toast("Giờ",s)
        return s
    elif "định nghĩa" in text:
        return speak("Bot: haha")
    elif "chơi nhạc" in text:
        return play_song(text)
    else:
        return query(text)


def search(text):
    url = "https://www.google.com.vn/search?q={}".format(text)
    webbrowser.open(url)
    s = "Không có thông tin, và sau đây là 1 vài kết quả"
    speak(s)
    return s


def open_website_search(text):
    reg_ex = re.search('kiếm (.+)', text)
    if reg_ex:
        domain = reg_ex.group(1)
        url = "https://www.google.com.tr/search?q={}".format(domain)
        webbrowser.open(url)
        speak("Trang web bạn yêu cầu đã được mở.")
        return True
    else:
        return False


def get_time(text):
    now = datetime.datetime.now()
    if "giờ" in text:
        speak('Bây giờ là %d giờ %d phút' % (now.hour, now.minute))
        return('Bây giờ là %d giờ %d phút' % (now.hour, now.minute))
    elif "ngày" in text:
        speak("Hôm nay là ngày %d tháng %d năm %d" %
              (now.day, now.month, now.year))
        return("Hôm nay là ngày %d tháng %d năm %d" %
               (now.day, now.month, now.year))
    else:
        speak("Bot chưa hiểu ý của bạn. Bạn nói lại được không?")


def open_website(text):
    reg_ex = re.search('web (.+)', text)
    if reg_ex:
        domain = reg_ex.group(1)
        url = 'https://www.' + domain
        webbrowser.open(url)
        speak("Trang web bạn yêu cầu đã được mở.")
        return 'Trang web bạn yêu cầu đã được mở.'
    else:
        return False


def stop():
    speak("Hẹn gặp lại bạn nhé")
    return 'Hẹn gặp lại bạn nhé'


def language_voice(text):
    reg_ex = re.search('tiếng (.+)', text)
    if reg_ex:
        if reg_ex:
            domain = reg_ex.group(1)
            if 'việt' in domain:
                return 'vi'
            if 'nhật' in domain:
                return 'ja'
            if 'anh' in domain:
                return 'en'
            if 'trung' in domain:
                return 'zh'
            if 'pháp' in domain:
                return 'fr'
            if 'hàn' in domain:
                return 'ko'
            else:
                return 'vi'
    else:
        return 'vi'


def gold_price():
    url = 'https://www.pnj.com.vn/blog/gia-vang/'
    page = urllib.request.urlopen(url)
    soup = BeautifulSoup(page, 'html.parser')
    sult = soup.find(class_='tabBody mgbt15').find_all("td")
    CLEANR = re.compile('<.*?>')
    a2 = []
    for a in sult:
        c = re.sub(CLEANR, '', str(a))
        c = c.replace(',', '.')
        a2.append(c)
    a1 = 'Giá bán vàng ' + a2[0]+': ' + a2[1] + ' đồng' + '\n'+'Giá mua vàng ' + a2[0]+': ' + a2[2] + \
        ' đồng'+'\n'+'Giá bán vàng ' + \
        a2[3]+': ' + a2[4] + ' đồng'+'\n'+'Giá mua vàng ' + \
        a2[3]+': ' + a2[5] + ' đồng'
    return a1


def get_voice():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Tôi: ", end='')
        audio = r.listen(source, phrase_time_limit=5)
        try:
            text = r.recognize_google(audio, language="vi-VN")
            print(text)
            return text
        except:
            print("...")
            return 0


def Toast(name, text):
    toast.show_toast(name, text)


def play_song(text):
    reg_ex = re.search('bài (.+)', text)
    domain = reg_ex.group(1)
    mysong = domain
    while True:
        result = YoutubeSearch(mysong, max_results=10).to_dict()
        if result:
            break
    url = 'https://www.youtube.com' + result[0]['url_suffix']
    webbrowser.open(url)
    speak("Bài hát bạn yêu cầu đã được mở.")
    return 'Bài hát bạn yêu cầu đã được mở ' + url


def speak2(lang, text):
    language_v = language_voice(lang)
    print("Bot: {}".format(text))
    # truyen vao text de doc language
    tts = gTTS(text=text, lang=language_v, slow=False)
    # luu am thanh vao he thong
    tts.save('sound.mp3')
    # play song truyen tu text
    playsound.playsound('sound.mp3', False)
    # xoa song
    os.remove('sound.mp3')


def query(text):
    user_query = text
    URL = "https://www.google.co.in/search?q=" + user_query
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.57'
    }
    page = requests.get(URL, headers=headers)
    soup = BeautifulSoup(page.content, 'html.parser')
    bebe = str(soup)
    if 'class="LGOjhe"' in bebe:
        sult = soup.find(class_="LGOjhe").find(class_="hgKElc").get_text()
        speak2(user_query, sult)
        return sult
    # dịch
    if 'class="Y2IQFc"' in bebe:
        sult = soup.find(id='tw-target-text').get_text()
        speak2(user_query, sult)
        return sult
    elif 'class="vk_bk dDoNo FzvWSb"' in bebe:
        sult = soup.find(class_='vk_bk dDoNo FzvWSb').get_text()
        speak(sult)
        time.sleep(6)
        return sult
    # thông tin cơ bản
    elif 'class="Z0LcW"' in bebe:
        sult = soup.find(class_='Z0LcW').get_text()
        speak(sult)
        return sult
    # giá bicoin
    elif 'class="pclqee"' in bebe:
        sult = soup.find(class_='pclqee').get_text()
        speak(sult+'VNĐ')
        return sult+' VNĐ'
    elif 'class="LGOjhe"' in bebe:
        sult = soup.find(class_='LGOjhe').find(class_='hgKElc').get_text()
        speak(sult)
        return sult
    # lyric
    elif 'class="Oh5wg"' in bebe:
        sult = soup.find(class_='Oh5wg').find_all('span', jsname="YS01Ge")
        a = ''
        for lyric in sult:
            clean = re.compile('<.*?>')
            lyric = re.sub(clean, '', str(lyric))
            a += lyric+'\n'
        f = open('Data/lyric.txt', 'w', encoding="utf8")
        path = os.path.realpath(f.name)
        print(path)
        f.write(a)
        s = 'Lời bài hát đã được mở'
        speak(s)
        os.startfile(path)
        return(s)
    elif 'class="PZPZlf"' in bebe:
        sult = soup.find(class_='bbVIQb').find_all('span', jsname="Vinbg")
        a = ''
        for lyric in sult:
            clean = re.compile('<.*?>')
            lyric = re.sub(clean, '', str(lyric))
            a += lyric+'\n'
        f = open('Data/lyric.txt', 'w', encoding="utf8")
        path = os.path.realpath(f.name)
        print(path)
        f.write(a)
        s = 'Lời bài hát đã được mở'
        speak(s)
        os.startfile(path)
        return(s)
    elif 'class="FzvWSb"' in bebe:
        sult = soup.find(class_='FzvWSb').get_text()
        speak(sult)
        return sult
    # máy tính
    elif 'class="z7BZJb XSNERd"' in bebe:
        sult = soup.find(class_='qv3Wpe').get_text()
        speak(text + ' là ' + sult)
        return sult
    # khoang cách
    elif 'class="BbbuR uc9Qxb uE1RRc"' in bebe:
        sult = soup.find(class_='BbbuR uc9Qxb uE1RRc').find_all(
            'span', class_=None)
        a = ''
        for lyric in sult:
            clean = re.compile('<.*?>')
            lyric = re.sub(clean, '', str(lyric))
            a += lyric+' '
            a = a.replace(',', '.')
        speak(a)
        return a
    # tiền tệ
    elif 'class="dDoNo ikb4Bb gsrt"' in bebe:
        sult = soup.find(class_='dDoNo ikb4Bb gsrt').get_text()
        speak(text + ' là ' + sult)
        return sult
    # cào bên phải wikipedia
    elif 'class="kno-rdesc"' in bebe:
        sult = soup.find(class_='kno-rdesc').find('span')
        CLEANR = re.compile('<.*?>')
        sult = re.sub(CLEANR, '', str(sult))
        speak(sult)
        return sult
    elif 'class="ayRjaf"' in bebe:
        sult = soup.find(class_='zCubwf').get_text()
        speak(sult)
        return sult
    # đổi các đơn vị
    elif 'class="dDoNo vrBOv vk_bk"' in bebe:
        sult = soup.find(class_='dDoNo vrBOv vk_bk').get_text()
        speak(sult)
        return sult
    # descript
    elif 'class="hgKElc"' in bebe:
        sult = soup.find(class_='hgKElc').get_text()
        speak(sult)
        return sult
    # thoi tiet
    elif 'class="UQt4rd"' in bebe:
        nhietdo = 'Nhiệt độ: ' + \
            soup.find(class_='q8U8x').get_text() + '°C.'+'\n'
        doam = 'Độ ẩm: ' + soup.find(id='wob_hm').get_text()
        mua = 'Khả năng có mưa: ' + soup.find(id='wob_pp').get_text()+'\n'
        gdp = soup.find(class_='wob_tci')
        wheather = gdp['alt']+'\n'
        nam = wheather + nhietdo + mua + doam
        # toast.show_toast("Thời tiết",nam)
        speak(nam)
        return nam
    elif 'class="gsrt vk_bk FzvWSb YwPhnf"' in bebe:
        sult = soup.find(class_='gsrt vk_bk FzvWSb YwPhnf').get_text()
        speak(sult)
        return sult
    else:
        if len(text) > 0:
            return search(text)


def translate(text):
    try:
        lang = language_voice(text)
        translated = translator.translate(text, dest=lang)
        trans = translated.text
        trans = trans.lower()
        speak2(lang, trans)
        return trans
    except:
        speak('lỗi rồi')
        return('Đã có lỗi xảy ra')


def change_volume(text):
    if 'giảm' in text:
        try:
            s = re.findall(r'\d', text)
            s = int(''.join(s))
        except:
            s = 1
        pyautogui.press('volumedown', presses=s)
    if 'tăng' in text:
        try:
            s = re.findall(r'\d', text)
            s = int(''.join(s))
        except:
            s = 1
        pyautogui.press('volumeup', presses=s)
    if 'tắt' in text:
        pyautogui.press('volumemute')
    speak('đã chỉnh')
    return 'Đã chỉnh thành công'


def speak(text):
    print("Bot: {}".format(text))
    # truyen vao text de doc language
    tts = gTTS(text=text, lang=language, slow=False)
    # luu am thanh vao he thong
    tts.save('sound.mp3')
    # play song truyen tu text
    playsound.playsound('sound.mp3', False)
    # xoa song
    os.remove('sound.mp3')


class ConverterApp(MDApp):
    def show_data(self, txt):
        dialog = MDDialog(text=txt)
        dialog.open()

    def text(self, text, ):
        self.item = TwoLineListItem(
            text="Bạn",
            secondary_text=self.input.text,
            height=25)
        self.list_view.add_widget(self.item)
        self.scroll.scroll_to(self.item)
        text = self.input.text
        text = text.lower()
        s = call_bot(text)
        if s:
            self.item = TwoLineListItem(
                text='Bot',
                secondary_text=s,)
            self.list_view.add_widget(self.item)
            self.scroll.scroll_to(self.item)
            self.close_button = MDRaisedButton(
                text='Đóng', on_release=self.close_dialog)
            self.dialog = MDDialog(
                title='Kết quả', text=s, buttons=[self.close_button])
            self.dialog.open()
    def close_dialog(self, obj):
        self.dialog.dismiss()

    def voice(self, text, ):
        speak('Bạn cần tôi giúp gì nào')
        text = get_text()
        text = text.lower()
        if text:
            self.item = TwoLineListItem(
                text="Bạn",
                secondary_text=text,
                height=25)
            self.list_view.add_widget(self.item)
            self.scroll.scroll_to(self.item)
            s = call_bot(text)
            if s:
                self.item = TwoLineListItem(
                    text='Bot',
                    secondary_text=s,)
                self.list_view.add_widget(self.item)
                self.scroll.scroll_to(self.item)
                self.close_button = MDRaisedButton(
                    text='Đóng', on_release=self.close_dialog)
                self.dialog = MDDialog(
                    title='Kết quả', text=s, buttons=[self.close_button])
                self.dialog.open()
        else:
            speak('không có dữ liệu')

    def build(self):
        Window.pos_hint = {'center_x': 0, 'center_y': 0}
        self.state = 0  # initial state
        screen = MDScreen()

        # top toolbar
        self.toolbar = MDToolbar(title="Trợ lý ảo")
        self.toolbar.pos_hint = {"top": 1}
        self.toolbar.right_action_items = [
            ["play"]]
        # banner

        # list view
        self.scroll = ScrollView(
            pos_hint={"top": 0.9},
            size_hint=(1, 0.78)
        )
        self.list_view = MDList()
        self.scroll.add_widget(self.list_view)
        self.item2 = OneLineListItem(text='Bot: Chào bạn ' + get_name())
        self.list_view.add_widget(self.item2)
        self.item2 = OneLineListItem(text='Tôi là trợ lý VKU')
        self.list_view.add_widget(self.item2)
        self.item2 = OneLineListItem(
            text='Tôi có thể giúp bạn rất nhiều việc đó')
        self.list_view.add_widget(self.item2)
        self.item2 = OneLineListItem(text='Tôi có thể giúp bạn dịch')
        self.list_view.add_widget(self.item2)
        self.item2 = OneLineListItem(text='Tôi có thể giúp bạn chơi nhạc')
        self.list_view.add_widget(self.item2)
        self.item2 = OneLineListItem(text='Tôi có thể giúp bạn xem thời tiết')
        self.list_view.add_widget(self.item2)
        self.item2 = OneLineListItem(text='Và rất nhiều việc nữa hì hì')
        self.list_view.add_widget(self.item2)
        self.input = MDTextField(
            size_hint=(0.6, 0.4),
            hint_text="Bạn muốn nói gì với tôi",
            mode="rectangle",
            pos_hint={"center_x": 0.35, "center_y": 0.07},
            font_size=15
        )

        # secondary + primary labels
        # "CONVERT" button
        self.voicemic = MDRaisedButton(
            text="Nói",
            font_size=17,
            size_hint=(0.14, None),
            pos_hint={"center_x": 0.9, "center_y": 0.06},
            on_press=self.voice
        )
        self.send = MDRaisedButton(
            text="Gửi",
            font_size=17,
            size_hint=(0.14, None),
            pos_hint={"center_x": 0.75, "center_y": 0.06},
            on_press=self.text
        )
        screen.add_widget(self.scroll)
        screen.add_widget(self.voicemic)
        screen.add_widget(self.send)
        screen.add_widget(self.input)
        screen.add_widget(self.toolbar)

        return screen


if __name__ == '__main__':
    speak('Chào bạn ' + get_name())
    ConverterApp().run()
