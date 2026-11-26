
from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from datetime import datetime, date
import os

load_dotenv()

app = Flask(__name__)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["student_task_db"]
tasks = db["tasks"]


def serialize_task(task):
    deadline = task.get("deadline")
    if isinstance(deadline, (datetime, date)):
        deadline_str = deadline.strftime("%Y-%m-%d")
    elif deadline is None:
        deadline_str = ""
    else:
        deadline_str = str(deadline)

    return {
        "_id": str(task["_id"]),
        "nama_tugas": task.get("nama_tugas", ""),
        "mata_kuliah": task.get("mata_kuliah", ""),
        "deskripsi": task.get("deskripsi", ""),
        "deadline": deadline_str,
        "prioritas": task.get("prioritas", ""),
        "status": task.get("status", "")
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    try:
        data = [serialize_task(task) for task in tasks.find().sort("created_at", -1)]
        return jsonify(data)
    except PyMongoError as e:
        return jsonify({"error": f"Gagal mengambil data dari MongoDB: {e}"}), 500


@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}
    try:
        task = {
            "nama_tugas": data["nama_tugas"],
            "mata_kuliah": data["mata_kuliah"],
            "deskripsi": data.get("deskripsi", ""),
            "deadline": datetime.strptime(data["deadline"], "%Y-%m-%d"),
            "prioritas": data["prioritas"],
            "status": data["status"],
            "created_at": datetime.now()
        }
        result = tasks.insert_one(task)
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Data tugas tidak valid: {e}"}), 400
    except PyMongoError as e:
        return jsonify({"error": f"Gagal menyimpan ke MongoDB: {e}"}), 500

    return jsonify({
        "message": "Tugas berhasil ditambahkan",
        "id": str(result.inserted_id)
    }), 201


@app.route("/api/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    try:
        oid = ObjectId(task_id)
        payload = {
            "nama_tugas": data["nama_tugas"],
            "mata_kuliah": data["mata_kuliah"],
            "deskripsi": data.get("deskripsi", ""),
            "deadline": datetime.strptime(data["deadline"], "%Y-%m-%d"),
            "prioritas": data["prioritas"],
            "status": data["status"]
        }
        tasks.update_one({"_id": oid}, {"$set": payload})
    except InvalidId:
        return jsonify({"error": "ID tugas tidak valid"}), 400
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Data tugas tidak valid: {e}"}), 400
    except PyMongoError as e:
        return jsonify({"error": f"Gagal memperbarui data di MongoDB: {e}"}), 500

    return jsonify({"message": "Tugas berhasil diperbarui"})


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        tasks.delete_one({"_id": ObjectId(task_id)})
    except InvalidId:
        return jsonify({"error": "ID tugas tidak valid"}), 400
    except PyMongoError as e:
        return jsonify({"error": f"Gagal menghapus data di MongoDB: {e}"}), 500

    return jsonify({"message": "Tugas berhasil dihapus"})


if __name__ == "__main__":
    try:
        client.admin.command("ping")
        print("Berhasil terhubung ke MongoDB Atlas!")
    except PyMongoError as e:
        print(f"Peringatan: gagal terhubung ke MongoDB ({e}). Periksa MONGO_URI di file .env.")
    app.run(debug=True)
