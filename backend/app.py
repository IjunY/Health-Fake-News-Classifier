from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from opencc import OpenCC
from newspaper import Article
from newspaper.article import ArticleException
import joblib
import os
import jieba
import re

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# text-preprocessing files
jieba.set_dictionary(os.path.join(BASE_DIR, "backend", "word_dict", "dict.txt.big"))
stopwords_path = os.path.join(BASE_DIR, "backend", "word_dict", "tw_stopwords.txt")
stopwords = set(
    [line.strip() for line in open(stopwords_path, encoding="utf-8").readlines()]
)

# frontend files
homepage = os.path.join(BASE_DIR, "src", "templates", "index.html")

# model_files
models = os.path.join(BASE_DIR, "backend", "models")
model = joblib.load(os.path.join(models, "logistic_regression.pkl"))


# tokenization
def tokenize(text):
    text = OpenCC("s2twp").convert(text)
    text = text.strip().replace("\n", "").replace("\r", "")
    tokens = jieba.cut(text, cut_all=False)

    # Check if word length > 1 characters AND is not a digit
    tokens = [
        word
        for word in tokens
        if word not in stopwords
        and len(word) > 1
        and not any(char.isdigit() for char in word)
    ]
    return " ".join(tokens)


def verify_url(article):
    try:
        article.download()
        article.parse()
    except ArticleException as article_err:
        print(f"Article Error: {article_err}")
        return (
            jsonify({"error": "download failure"}),
            404,
        )
    except ConnectionError as connection_err:
        print(f"Connection Error: {connection_err}")
        return (
            jsonify({"error": "Internet connection"}),
            500,
        )
    except Exception as e:
        print(f"An unknown error occured: {e}")
        return (
            jsonify({"error": "unknown error"}),
            500,
        )

    return article.text


def process_sentences(text):
    # Split the entire text into sentences separated by punctuation or line break
    sent_scores = []
    sentences = re.split(r"[\n。？！!?]", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    # Calculate how likely each sentence is true / false
    for sent in sentences:
        try:
            tokenized_sent = tokenize(sent)
            # Calculate probability
            prob = model.predict_proba([tokenized_sent])
            # Convert probabilities to 1-D array
            prob = prob.ravel()
            sent_pred = model.predict([tokenized_sent])[0]
            sent_scores.append(
                {
                    "sentence": sent,
                    "prediction": sent_pred,
                    "probability": prob[sent_pred],
                }
            )
        except Exception as e:
            print("error processing sentence: ", e)
            continue

    # Sort sentences by probability
    sent_scores = sorted(sent_scores, key=lambda s: s["probability"], reverse=True)
    return [s["sentence"] for s in sent_scores[:3]]


def process_text(text):
    tokens = tokenize(text)
    prediction = int(model.predict([tokens])[0])
    probabilities = model.predict_proba([tokens])[0]
    probability = probabilities[prediction]
    return prediction, probability


def finalize_result(prediction, probability, sentences, title, text):
    result = {
        "prediction": prediction,
        "probability": f"{float(probability):.0%}",
        "sentences": sentences,
        "title": title,
        "text": text,
    }
    return result


@app.route("/predict", methods=["POST"])
def predict():
    if not model:
        return jsonify({"error": "model selection error"}), 500

    data, article_text, article_title, article = (
        None,
        None,
        None,
        None,
    )

    data = (
        request.get_json(silent=True) or {}
    )  # silence error because jsx already strictly regulate return content-type as json

    url = data.get("url")
    manual_content = data.get("manualContent")

    # User entered content manually, use it to analyze
    if manual_content:
        article_text = manual_content
    # URL field was entered, try parse the url
    elif url:
        article = Article(url)
        verify_url_result = verify_url(article)
        if isinstance(verify_url_result, tuple):
            return verify_url_result
        article_text = verify_url_result
    # No url was provided
    else:
        return jsonify({"error": "invalid url"}), 400

    if not article_text:
        print("can't process article text")
        return jsonify({"error": "no content"}), 400

    # Extract article title
    article_title = article.title if article else None

    # Remove white spaces
    article_text_strip = article_text.strip()

    try:
        # Process entire text
        prediction, probability = process_text(article_text_strip)

        # Extract key sentences that affected the model's decision
        top_3_sentences = process_sentences(article_text_strip)

        result = finalize_result(
            prediction, probability, article_title, top_3_sentences, article_text
        )
        return jsonify(result)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Prediction uncompleted"}), 500


if __name__ == "__main__":
    app.run(port=5500, debug=True)
