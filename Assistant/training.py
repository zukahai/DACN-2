#Used in Tensorflow Model
import numpy as np
import tensorflow as tf
import tflearn
import random

#Usde to for Contextualisation and Other NLP Tasks.
import nltk
from nltk.stem.lancaster import LancasterStemmer
stemmer = LancasterStemmer()

#Other
import json
import pickle
import warnings
from tensorflow.python.framework import ops
warnings.filterwarnings("ignore")
#mở file json
print("Processing the Intents.....")
with open('Data/intents.json', encoding='utf-8') as json_data:
    intents = json.load(json_data)
words = []
classes = []
documents = []
ignore_words = ['?', '!', '.', ',']
print("Looping through the Intents to Convert them to words, classes, documents and ignore_words.......")
for intent in intents['intents']:
    for pattern in intent['patterns']:
        # tác từ trong từng câu
        w = nltk.word_tokenize(pattern)
        # thêm từ vào list words
        words.extend(w)
        # thêm vào kho dữ liệu
        documents.append((w, intent['tag']))
        # thêm tag vào classes 
        if intent['tag'] not in classes:
            classes.append(intent['tag'])
print("Stemming, Lowering and Removing Duplicates.......")
#chuẩn hóa các từ loại bỏ các dấu câu
words = [stemmer.stem(w.lower()) for w in words if w not in ignore_words]
#sắp xếp các từ trong list
words = sorted(list(set(words)))
print(len(words))
# loại bỏ các từ trùng lặp
classes = sorted(list(set(classes)))

print (len(documents), "documents")
print (len(classes), "classes", classes)
print (len(words), "unique stemmed words", words)
#tạo dữ liệu để chuẩn bị huấn luyện
print("Creating the Data for our Model.....")
training = []
output = []
print("Creating an List (Empty) for Output.....")
output_empty = [0] * len(classes)

print("Creating Traning Set, Bag of Words for our Model....")
for doc in documents:
    # khởi tạo bag of words
    bag = []
    # danh sách các từ được chuẩn hóa
    pattern_words = doc[0]
    # tacsg từ từ
    pattern_words = [stemmer.stem(word.lower()) for word in pattern_words]
    # tạo danh sách bag of words 
    for w in words:
        bag.append(1) if w in pattern_words else bag.append(0)

    # output is a '0' for each tag and '1' for current tag
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1

    training.append([bag, output_row])

    print("Shuffling Randomly and Converting into Numpy Array for Faster Processing......")
random.shuffle(training)
training = np.array(training)

print("Creating Train and Test Lists.....")
train_x = list(training[:,0])
train_y = list(training[:,1])
print("Building Neural Network for Out Chatbot to be Contextual....")
print("Resetting graph data....")
ops.reset_default_graph()
#huấn luyện dữ liểu
net = tflearn.input_data(shape=[None, len(train_x[0])])
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, len(train_y[0]), activation='softmax')
net = tflearn.regression(net)
print("Training....")
model = tflearn.DNN(net, tensorboard_dir='tflearn_logs')
print("Training the Model.......")
model.fit(train_x, train_y, n_epoch=1000, batch_size=12, show_metric=True)
print("Saving the Model.......")
model.save('Model/model.tflearn')
print("Pickle is also Saved..........")
pickle.dump( {'words':words, 'classes':classes, 'train_x':train_x, 'train_y':train_y}, open( "training_data", "wb" ) )