import numpy as np
from sentence_transformers import SentenceTransformer
import jieba

# Load the model
model_zh = SentenceTransformer('shibing624/text2vec-base-chinese')

def preprocess_text(text, lang='zh'):
    tokens = [word for word in jieba.cut(text) if word.strip()]
    return ' '.join(tokens)

def get_embedding(text, lang='zh'):
    preprocessed_text = preprocess_text(text, lang)
    embedding = model_zh.encode(preprocessed_text)
    print(f"Generated embedding dimension: {len(embedding)}")
    return embedding

# Test with Chinese text
try:
    text = "一"
    embedding = get_embedding(text, lang='zh')
    print("Embedding:", embedding)
except Exception as e:
    print(f"Error: {e}")
