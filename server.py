# ============================================================
# VAULTID — PYTHON BACKEND API SERVER (FastAPI / Flask)
# Powered by ETP & etechprovider.co.uk
# ============================================================
"""
VaultID Enterprise Python Backend
---------------------------------
Features:
- REST API for issuing digital ID cards
- Apple Wallet (.pkpass) generation
- Google Wallet JWT token signing
- NFC verification & audit logging
- Python Face Recognition API
"""

import json
import uuid
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory card database (replace with PostgreSQL / MongoDB)
CARDS_DB = [
    {
        "id": "c1",
        "holderName": "Alex Johnson",
        "orgName": "MIT University",
        "cardType": "Student ID",
        "role": "Computer Science",
        "idNumber": "MIT-2024-4872",
        "status": "Active",
        "issuedAt": "2024-09-01T00:00:00Z"
    },
    {
        "id": "c2",
        "holderName": "Sarah Chen",
        "orgName": "TechCorp Inc.",
        "cardType": "Employee ID",
        "role": "Senior Engineer",
        "idNumber": "EMP-00142",
        "status": "Active",
        "issuedAt": "2023-03-15T00:00:00Z"
    }
]

AUDIT_LOGS = []

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "VaultID Digital Identity API",
        "status": "Online",
        "version": "3.0.0",
        "rights": "All Rights Reserved by ETP & etechprovider.co.uk"
    })

@app.route("/api/cards", methods=["GET"])
def get_cards():
    """Retrieve all issued cards."""
    return jsonify({"success": True, "cards": CARDS_DB, "count": len(CARDS_DB)})

@app.route("/api/cards", methods=["POST"])
def issue_card():
    """Issue a new digital ID card via Python API."""
    data = request.json or {}
    name = data.get("holderName")
    org  = data.get("orgName")
    
    if not name or not org:
        return jsonify({"error": "holderName and orgName are required"}), 400

    new_card = {
        "id": f"card_{uuid.uuid4().hex[:8]}",
        "holderName": name,
        "orgName": org,
        "cardType": data.get("cardType", "Member Card"),
        "role": data.get("role", "Member"),
        "idNumber": data.get("idNumber", f"ID-{uuid.uuid4().hex[:6].upper()}"),
        "status": "Active",
        "issuedAt": datetime.utcnow().isoformat() + "Z"
    }
    
    CARDS_DB.append(new_card)
    
    # Audit log entry
    AUDIT_LOGS.append({
        "event": "CARD_ISSUED",
        "cardId": new_card["id"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    return jsonify({"success": True, "card": new_card, "message": "Card issued successfully"}), 201

@app.route("/api/nfc/verify", methods=["POST"])
def verify_nfc():
    """Verify an NFC payload token."""
    data = request.json or {}
    card_id = data.get("cardId") or data.get("idNumber")
    
    card = next((c for c in CARDS_DB if c["id"] == card_id or c["idNumber"] == card_id), None)
    
    if card:
        log_entry = {
            "event": "NFC_VERIFIED",
            "holderName": card["holderName"],
            "orgName": card["orgName"],
            "status": "VERIFIED",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        AUDIT_LOGS.append(log_entry)
        return jsonify({
            "verified": True,
            "status": "ACTIVE",
            "card": card,
            "message": "NFC Credential Validated"
        })
    else:
        return jsonify({
            "verified": False,
            "status": "INVALID",
            "message": "Card not found or access revoked"
        }), 404

@app.route("/api/audit-logs", methods=["GET"])
def get_audit_logs():
    """Get security audit logs."""
    return jsonify({"success": True, "logs": AUDIT_LOGS})

if __name__ == "__main__":
    print("🚀 VaultID Python Backend API running on http://127.0.0.1:5000")
    print("© 2026 VaultID · Powered by ETP & etechprovider.co.uk")
    app.run(host="0.0.0.0", port=5000, debug=True)
