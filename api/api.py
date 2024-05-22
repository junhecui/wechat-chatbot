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
        return jsonify({'error': 'No text provided'}), 400

    try:
        embedding = get_embedding(text, lang)
        return jsonify({'embedding': embedding.tolist()})
    except Exception as e:
        app.logger.error(f"Error in embedding: {str(e)}")
        return jsonify({'error': 'Failed to generate embedding'}), 500

@app.route('/similarity', methods=['POST'])
def similarity():
    data = request.json
    embedding1 = np.array(data.get('embedding1'))
    embedding2 = np.array(data.get('embedding2'))

    if embedding1 is None or embedding2 is None:
        return jsonify({'error': 'Embeddings not provided'}), 400

    if embedding1.shape != embedding2.shape:
        return jsonify({'error': f'Embedding dimensions do not match: {embedding1.shape} vs {embedding2.shape}'}), 400

    try:
        similarity = cosine_similarity(embedding1, embedding2)
        return jsonify({'similarity': similarity})
    except Exception as e:
        app.logger.error(f"Error in similarity: {str(e)}")
        return jsonify({'error': 'Failed to compute similarity'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4999)
