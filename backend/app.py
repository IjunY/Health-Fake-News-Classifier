from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from opencc import OpenCC
from newspaper import Article
import joblib
import os
import jieba
import re

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#text-preprocessing files
jieba.set_dictionary(os.path.join(BASE_DIR, 'backend', 'word_dict', 'dict.txt.big'))
stopwords_path = os.path.join(BASE_DIR, 'backend', 'word_dict', 'tw_stopwords.txt')
stopwords = set([line.strip() for line in open(stopwords_path, encoding='utf-8').readlines()])

#frontend files
homepage = os.path.join(BASE_DIR, 'src', 'templates', 'index.html')

#model_files
models = os.path.join(BASE_DIR, 'backend', 'models')
model = joblib.load(os.path.join(models, 'logistic_regression.pkl'))

#tokenization
def tokenize(text):
    text = OpenCC('s2twp').convert(text)
    text = text.strip().replace('\n', '').replace('\r', '')
    tokens = jieba.cut(text, cut_all=False)

    # Check if word length > 1 characters AND is not a digit
    tokens = [word for word in tokens
              if word not in stopwords and len(word) > 1
              and not any(char.isdigit() for char in word)]
    return ' '.join(tokens)

@app.route('/predict', methods=['POST'])
def predict():
    print("Program started")
    if request.method == 'POST' and model:
        data, sentences, article_text, article_title, article = None, None, None, None, None
        data = request.get_json(silent=True) or {} #silence error because jsx already strictly regulate return content-type as json
        url = data.get('url')
        manual_content = data.get('manualContent')

        if manual_content:
            article_text = manual_content
        elif url:
            try:
                article = Article(url)
                article.download()
                article.parse()
                article_text = article.text
            except Exception as e:
                print(f"Error fetching article from URL: {e}")
                return jsonify({"error": "Failed to fetch article content, please manually enter article text"}), 500
        else:
            return jsonify({"error": "Please provide a URL"}), 400
        article_text_strip = article_text.strip() #get rid of white spaces
        print('text', article_text_strip)
        
        tokens = tokenize(article_text_strip)

        #Processing title 
        article_title = article.title if article else None

        #Processing sentences
        sent_scores = []
        sentences = re.split(r'[\n。？！!?]', article_text_strip)
        sentences = [s.strip() for s in sentences if s.strip()]
        for sent in sentences: 
            try:
                tokenized_sent = tokenize(sent)
                prob = model.predict_proba([tokenized_sent]).ravel()
                sent_pred = model.predict([tokenized_sent])[0]
                sent_scores.append(
                    {
                        'sentence': sent,
                        'prediction': sent_pred,
                        'probability': prob[sent_pred]
                    }
                )
            except Exception as e:
                print('error processing sentence: ', e)
                continue

        sent_scores = sorted(sent_scores, key=lambda s: s['probability'], reverse=True)
        print('sent_scores', sent_scores)
        sent_results = [s['sentence'] for s in sent_scores[:3]]
        print('sent_results', sent_results)

        try:
            prediction = int(model.predict([tokens])[0])
            probabilities = model.predict_proba([tokens])[0] 
            probability = probabilities[prediction]
            print(f'Prob: {probability}')
            result = {
                "prediction": int(prediction),
                "probability": f"{float(probability):.0%}", 
                "sentences": sent_results,
                "title": article_title,
                "text": article_text[1:50]
            }
            print('result', result)
            return jsonify(result)
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": "Prediction uncompleted"}), 500      
    
if __name__ == '__main__':
    app.run(port=5500, debug=True)