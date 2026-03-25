from pymongo import MongoClient

# MongoDB Atlas connection


import os
MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["Crisislens"]
contacts_collection = db["Queries"]


