import numpy as np
from sentence_transformers import SentenceTransformer
import jieba
import stanza
import nltk
from nltk.corpus import stopwords
import os

# Initialize NLP models and stopwords
def initialize_nlp_models():
    stanza.download('en')
    stanza.download('zh')
    nltk.download('stopwords')
    nlp_en = stanza.Pipeline('en')
    nlp_zh = stanza.Pipeline('zh')
    model_en = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    model_zh = SentenceTransformer('shibing624/text2vec-base-chinese')
    return nlp_en, nlp_zh, model_en, model_zh

def load_stopwords():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    stopwords_path = os.path.join(current_dir, '../config/stopwords-zh.txt')
    EN_STOP_WORDS = set(stopwords.words('english'))
    with open(stopwords_path, encoding='utf-8') as f:
        ZH_STOP_WORDS = set(line.strip() for line in f)
    return EN_STOP_WORDS, ZH_STOP_WORDS

nlp_en, nlp_zh, model_en, model_zh = initialize_nlp_models()
EN_STOP_WORDS, ZH_STOP_WORDS = load_stopwords()

def preprocess_text(text, lang='en'):
    """Preprocess text by removing stopwords and lemmatizing or tokenizing."""
    if lang == 'en':
        doc = nlp_en(text)
        tokens = [word.lemma for sent in doc.sentences for word in sent.words 
                  if word.lemma not in EN_STOP_WORDS and word.upos != 'PUNCT']
    elif lang == 'zh':
        tokens = [word for word in jieba.cut(text) 
                  if word.strip() and word not in ZH_STOP_WORDS]
    else:
        raise ValueError(f"Unsupported language: {lang}")
    return ' '.join(tokens)

def get_embedding(text, lang='en'):
    """Generate embedding for the given text and language."""
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
    """Calculate cosine similarity between two embeddings."""
    if len(embedding1) != len(embedding2):
        raise ValueError(f"Embedding dimensions do not match: {len(embedding1)} vs {len(embedding2)}")
    dot_product = np.dot(embedding1, embedding2)
    magnitude1 = np.linalg.norm(embedding1)
    magnitude2 = np.linalg.norm(embedding2)
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    return dot_product / (magnitude1 * magnitude2)
