import numpy as np
from sentence_transformers import SentenceTransformer
import jieba
import stanza
import nltk
from nltk.corpus import stopwords
from flask import Flask, request, jsonify

# Initialize models and stopwords
stanza.download('en')
stanza.download('zh')
nlp_en = stanza.Pipeline('en')
nlp_zh = stanza.Pipeline('zh')
nltk.download('stopwords')
model_en = SentenceTransformer('paraphrase-MiniLM-L6-v2')
model_zh = SentenceTransformer('shibing624/text2vec-base-chinese')

EN_STOP_WORDS = set(stopwords.words('english'))
with open('stopwords-zh.txt', encoding='utf-8') as f:
    ZH_STOP_WORDS = set(line.strip() for line in f)

def preprocess_text(text, lang='en'):
    if lang == 'en':
        doc = nlp_en(text)
        tokens = [word.lemma for sent in doc.sentences for word in sent.words if word.lemma not in EN_STOP_WORDS and word.upos != 'PUNCT']
    elif lang == 'zh':
        tokens = [word for word in jieba.cut(text) if word.strip() and word not in ZH_STOP_WORDS]
    else:
        raise ValueError(f"Unsupported language: {lang}")
    return ' '.join(tokens)

def get_embedding(text, lang='en'):
    preprocessed_text = preprocess_text(text, lang)
    if lang == 'en':
        embedding = model_en.encode(preprocessed_text)
    elif lang == 'zh':
        embedding = model_zh.encode(preprocessed_text)
    else:
        raise ValueError(f"Unsupported language: {lang}")
    print(f"Generated embedding dimension: {len(embedding)}")
    return embedding

def cosine_similarity(embedding1, embedding2):
    if len(embedding1) != len(embedding2):
        raise ValueError(f"Embedding dimensions do not match: {len(embedding1)} vs {len(embedding2)}")
    dot_product = np.dot(embedding1, embedding2)
    magnitude1 = np.linalg.norm(embedding1)
    magnitude2 = np.linalg.norm(embedding2)
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    return dot_product / (magnitude1 * magnitude2)

app = Flask(__name__)

@app.route('/embedding', methods=['POST'])
def embedding():
    try:
        data = request.json
        text = data['text']
        lang = data.get('lang', 'en')
        embedding = get_embedding(text, lang)
        return jsonify({'embedding': embedding.tolist()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/similarity', methods=['POST'])
def similarity():
    try:
        data = request.json
        embedding1 = np.array(data['embedding1'])
        embedding2 = np.array(data['embedding2'])
        similarity = cosine_similarity(embedding1, embedding2)
        return jsonify({'similarity': similarity})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=4999)
