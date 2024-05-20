import numpy as np
from sentence_transformers import SentenceTransformer
import stanza
import nltk
from nltk.corpus import stopwords

# Downloading English / Chinese models for stanza (if using other languages, import their stopwords)
stanza.download('en')
stanza.download('zh')

nlp_en = stanza.Pipeline('en')
nlp_zh = stanza.Pipeline('zh')
nltk.download('stopwords')
nltk.download('punkt')

model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

EN_STOP_WORDS = set(stopwords.words('english'))
with open('stopwords-zh.txt', encoding='utf-8') as f:
    ZH_STOP_WORDS = set(line.strip() for line in f)

def preprocess_text(text, lang='en'):
    if lang == 'en':
        doc = nlp_en(text)
        tokens = [word.lemma for sent in doc.sentences for word in sent.words if word.lemma not in EN_STOP_WORDS and word.upos != 'PUNCT']
    elif lang == 'zh':
        doc = nlp_zh(text)
        tokens = [word.text for sent in doc.sentences for word in sent.words if word.text not in ZH_STOP_WORDS and word.upos != 'PUNCT']
    else:
        raise ValueError(f"Unsupported language: {lang}")
    
    return ' '.join(tokens)

def get_embedding(text, lang='en'):
    preprocessed_text = preprocess_text(text, lang)
    embedding = model.encode(preprocessed_text)
    return embedding

def cosine_similarity(embedding1, embedding2):
    dot_product = np.dot(embedding1, embedding2)
    magnitude1 = np.linalg.norm(embedding1)
    magnitude2 = np.linalg.norm(embedding2)
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    return dot_product / (magnitude1 * magnitude2)
