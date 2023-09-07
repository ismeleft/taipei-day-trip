from flask import *
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__,
            static_folder='static',
            static_url_path='/static')
app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True

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


# Pages


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/attraction/<id>")
def attraction(id):
    return render_template("attraction.html")


@app.route("/booking")
def booking():
    return render_template("booking.html")


@app.route("/thankyou")
def thankyou():
    return render_template("thankyou.html")


# api
@app.route("/api/attractions")
def getAttractions():
    try:
        page = int(request.args.get("page", 0))
        keyword = request.args.get("keyword")

        conn = connection_pool.get_connection()
        cursor = conn.cursor()

        if keyword == None:
            query_count = "SELECT COUNT(*) FROM trip"
            cursor.execute(query_count)
            total_data = cursor.fetchone()[0]

            a_page_items = 12
            total_pages = (total_data + a_page_items - 1) // a_page_items
            if page < total_pages-1:
                next_page = page + 1
            else:
                next_page = None

            query_data = "SELECT * FROM trip LIMIT %s OFFSET %s"
            cursor.execute(query_data, (a_page_items, page*a_page_items))
            all_data = cursor.fetchall()

            data = []
            for item in all_data:
                data.append({
                    "id": item[0],
                    "name": item[1],
                    "category": item[2],
                    "description": item[3],
                    "address": item[4],
                    "transport": item[5],
                    "mrt": item[6],
                    "lat": item[7],
                    "lng": item[8],
                    "images": [item[9]]
                })

            cursor.close()
            conn.close()

            return jsonify({
                "nextPage": next_page,
                "data": data,
            }), 200

        else:

            search_query_count = '''
                SELECT COUNT(*) FROM trip 
                WHERE name LIKE %s OR mrt LIKE %s
            '''
            totally_keyword_pattern = f"%{keyword}"
            keyword_pattern = f"%{keyword}%"
            cursor.execute(search_query_count,
                           (keyword_pattern, totally_keyword_pattern))
            search_data_count = cursor.fetchone()[0]

            a_page_items = 12
            total_pages = (search_data_count +
                           a_page_items - 1) // a_page_items
            if page < total_pages-1:
                next_page = page + 1
            else:
                next_page = None

            search_query = '''
                SELECT * FROM trip 
                WHERE name LIKE %s OR mrt LIKE %s
                LIMIT %s OFFSET %s
            '''

            cursor.execute(search_query, (keyword_pattern,
                           totally_keyword_pattern, a_page_items, page * a_page_items))
            all_data = cursor.fetchall()

            data = []
            for item in all_data:
                data.append({
                    "id": item[0],
                    "name": item[1],
                    "category": item[2],
                    "description": item[3],
                    "address": item[4],
                    "transport": item[5],
                    "mrt": item[6],
                    "lat": item[7],
                    "lng": item[8],
                    "images": [item[9]]
                })

            cursor.close()
            conn.close()

            return jsonify({
                "nextPage": next_page,
                "data": data
            }), 200

    except mysql.connector.Error as err:
        print("資料庫錯誤：", err)
        return jsonify({
            "error": True,
            "message": "資料庫錯誤"
        }), 500


@app.route("/api/attraction/<int:attractionId>")
def attraction_id(attractionId):
    try:
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM trip WHERE id = %s"
        cursor.execute(query, (attractionId,))
        id_result = cursor.fetchone()

        cursor.close()
        conn.close()
        if (id_result):
            return jsonify({"data":
                            {"id": id_result[0],
                             "name": id_result[1],
                             "category": id_result[2],
                             "description": id_result[3],
                             "address": id_result[4],
                             "transport": id_result[5],
                             "mrt": id_result[6],
                             "lat": id_result[7],
                             "lng": id_result[8],
                             "images": [id_result[9]]
                             }}), 200
        else:
            return jsonify({
                "error": "true",
                "message": "景點編號不正確"
            }), 400
    except mysql.connector.Error as err:
        return jsonify({
            "error": "true",
            "message": "伺服器內部錯誤"
        }), 500


@app.route("/api/mrts")
def mrts():
    try:
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        query = "SELECT trip.mrt FROM trip WHERE trip.mrt is not null GROUP BY trip.mrt ORDER BY COUNT(trip.name) DESC LIMIT 40;"
        cursor.execute(query)
        mrts_attractions = cursor.fetchall()
        cursor.close()
        conn.close()
        if (mrts_attractions):
            mrts_list = [item[0] for item in mrts_attractions]
            return jsonify({
                "data": [mrts_list]
            }), 200
        else:
            return jsonify({
                "error": "true",
                "message": "資料庫錯誤"
            })
    except mysql.connector.Error as err:
        print("資料庫錯誤：", err)
        return "資料庫錯誤", 500


app.run(host="0.0.0.0", port=300)
