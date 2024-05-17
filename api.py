from flask import Flask, request, jsonify
from preprocessing import get_embedding, cosine_similarity
import numpy as np

app = Flask(__name__)

@app.route('/embedding', methods=['POST'])
def embedding():
    data = request.json
    text = data.get('text')
    lang = data.get('lang', 'en')

    if not text:
        return jsonify({'error; No text provided'})
    
    embedding = get_embedding(text, lang)
    return jsonify({'embedding': embedding.tolist()})

@app.route('/similarity', methods=['POST'])
def similarity():
    data = request.json
    embedding1 = np.array(data.get('embedding1'))
    embedding2 = np.array(data.get('embedding2'))

    if embedding1 is None or embedding2 is None:
        return jsonify({'error: Embeddings not provided'}), 400
    
    similarity = cosine_similarity(embedding1, embedding2)
    return jsonify({'similarity' : similarity})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4999)