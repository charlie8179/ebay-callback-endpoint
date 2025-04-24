from flask import Flask, request, jsonify
import hashlib
import os

app = Flask(__name__)

# Set these after deployment
VERIFICATION_TOKEN = os.getenv("VERIFICATION_TOKEN", "your_verification_token_here")
ENDPOINT_URL = os.getenv("ENDPOINT_URL", "https://yourrenderurl.onrender.com/ebay-deletion-notifications")

@app.route("/ebay-deletion-notifications", methods=["GET"])
def handle_challenge():
    challenge_code = request.args.get("challenge_code")
    if not challenge_code:
        return jsonify({"error": "Missing challenge_code"}), 400

    data = (challenge_code + VERIFICATION_TOKEN + ENDPOINT_URL).encode("utf-8")
    hashed = hashlib.sha256(data).hexdigest()

    return jsonify({"challengeResponse": hashed}), 200

if __name__ == "__main__":
    app.run(debug=True)
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
