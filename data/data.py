import json
import mysql.connector
from mysql.connector import pooling

db_config = {
    "user": "root",
    "password": "12345678",
    "host": "localhost",
    "database": "taipeiTrip"
}

pool_config = {
    "pool_name": "mypool",
    "pool_size": 10,
    "buffered": True,
    "connection_timeout": 30
}

connection_pool = mysql.connector.pooling.MySQLConnectionPool(
    **db_config, **pool_config)

# 將json資料傳到trip table
val = []
with open('./data/taipei-attractions.json', 'r', encoding='utf-8') as file:
    data = json.load(file)
    taipeilist = data['result']['results']
    for item in taipeilist:
        name = item['name']
        category = item['CAT']
        description = item['description']
        address = item['address'].replace(' ', '')
        transport = item['direction']
        mrt = item['MRT']
        lat = item['latitude']
        lng = item['longitude']

        image_urls = item["file"].split("https")
        images = []

        for url in image_urls:
            if url and (url[-3:]).lower() in ["jpg", "png"]:
                photos_url = "https"+url
                images.append(photos_url)

        val.append((name, category, description, address,
                   transport, mrt, lat, lng, ','.join(images)))


conn = connection_pool.get_connection()
cursor = conn.cursor()
query = "INSERT INTO trip(name, category, description, address, transport, mrt, lat, lng, images) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
cursor.executemany(query, val)
conn.commit()
cursor.close()
conn.close()
