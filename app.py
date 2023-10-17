from flask import *
import mysql.connector
from mysql.connector import pooling
from flask_bcrypt import Bcrypt
import jwt
from datetime import datetime, timedelta
import uuid
import requests
from dotenv import load_dotenv
load_dotenv()
import os

db_password=os.getenv("db_password")
db_user=os.getenv("db_user")
key = "secret"
partner_key=os.getenv("partner_key")


app = Flask(__name__,
            static_folder='static',
            static_url_path='/static')
app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True

db_config = {
    "user": db_user,
    "password": db_password,
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

bcrypt = Bcrypt()




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



@app.route("/membercenter")
def membercenter():
    return render_template("membercenter.html")

# api
@app.route("/api/attractions")
def getAttractions():
    try:
        page = int(request.args.get("page", 0))
        keyword = request.args.get("keyword")

        conn = connection_pool.get_connection()
        cursor = conn.cursor()

        a_page_items = 12

        if keyword is None:
            query_data = "SELECT * FROM trip LIMIT %s OFFSET %s"
            cursor.execute(query_data, (a_page_items + 1, page * a_page_items))
            all_data = cursor.fetchall()
        else:
            search_query = '''
                SELECT * FROM trip 
                WHERE name LIKE %s OR mrt LIKE %s
                LIMIT %s OFFSET %s
            '''
            totally_keyword_pattern = f"%{keyword}"
            keyword_pattern = f"%{keyword}%"
            cursor.execute(search_query, (keyword_pattern,
                           totally_keyword_pattern, a_page_items + 1, page * a_page_items))
            all_data = cursor.fetchall()

        data = []
        for item in all_data[:12]:
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

        has_next_page = len(all_data) > 12

        return jsonify({
            "nextPage": page + 1 if has_next_page else None,
            "data": data,
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


# 會員註冊api
@app.route("/api/user", methods=["POST"])
def signup():
    try:
        username = request.json.get("name")
        email = request.json.get("email")
        password = request.json.get("password")

        conn = connection_pool.get_connection()
        cursor = conn.cursor()

        if username == "" or email == "" or password == "":
            cursor.close()
            return jsonify({
                "error": True,
                "message": "請輸入對應的資訊"
            })

        query = "SELECT * FROM users WHERE email = %s "
        cursor.execute(query, (email,))
        existing_member = cursor.fetchone()
        if existing_member != None:
            cursor.close()
            return jsonify({
                "error": True,
                "message": "註冊失敗，email已被註冊"
            }), 400
        else:
            hashed_password = bcrypt.generate_password_hash(
                password=password)
            insertQuery = "INSERT INTO users(username,email,password) VALUES(%s,%s,%s)"
            cursor.execute(insertQuery, (username, email, hashed_password))
            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({"ok": "true"}), 200

    except mysql.connector.Error as err:
        print(f"MYSQL Error:{err}")
        return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500
    finally:
        if cursor is not None:
            cursor.close()


# 取得當前登入的資訊
@app.route("/api/user/auth", methods=["GET"])
def get_login_status():
    token = request.headers.get("Authorization")
    if token:
        try:
            token = token.split("Bearer ")[-1]
            user = jwt.decode(token, key, algorithms="HS256")
            return jsonify({
                "data": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]}
            }), 200
        except jwt.ExpiredSignatureError:
            return jsonify({
                "data": None,
                "message": "Token已過期"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "data": None,
                "message": "Token無效"
            }), 401
    else:
        return jsonify({
            "data": None,
            "message": "未提供Token"
        }), 401


# 登入會員帳戶
@app.route("/api/user/auth", methods=["PUT"])
def login():
    try:
        email = request.json["email"]
        password = request.json["password"]

        if email == "" or password == "":
            return jsonify({
                "error": True,
                "message": "請輸入對應的資訊"
            })
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM users WHERE email=%s"
        cursor.execute(query, (email,))
        existing_member = cursor.fetchone()
        exp_time = datetime.utcnow() + timedelta(days=7)

        if existing_member and bcrypt.check_password_hash(existing_member[3], password):
            token = jwt.encode({"id": existing_member[0],
                                "name": existing_member[1],
                                "email": existing_member[2],
                                "exp": exp_time}, key, algorithm="HS256")
            return jsonify({
                "token": token
            }), 200
        else:
            return jsonify({
                "error": True,
                "message": "登入失敗，email或密碼錯誤"
            }), 400
    except mysql.connector.Error as err:
        return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500


# booking API
# 建立新的預定行程
@app.route("/api/booking", methods=["POST"])
def create_booking():
    try:
        conn = connection_pool.get_connection()
        cursor = conn.cursor()

        token = request.headers.get("Authorization")
        if token:
            token = token.split("Bearer ")[-1]
            user = jwt.decode(token, key, algorithms="HS256")
            users_id = user["id"]
            tripId = request.json.get("id")
            bookingDate = request.json.get("date")
            bookingTime = request.json.get("time")
            bookingPrice = request.json.get("price")

            if tripId == "" or bookingDate == "" or bookingTime == "" or bookingPrice == "":
                return jsonify({
                    "error": True,
                    "message": "請填妥所有預定資訊"
                })
            query = "SELECT * FROM booking WHERE users_id = %s"
            cursor.execute(query, (users_id,))
            booking_result = cursor.fetchone()
            if (booking_result == None):
                query = "INSERT INTO booking (trip_id, date, time, price, users_id) VALUES (%s, %s, %s, %s, %s);"
                cursor.execute(
                    query, (tripId, bookingDate, bookingTime, bookingPrice, users_id))
                conn.commit()
            else:
                query = "UPDATE booking SET trip_id=%s, date=%s ,time =%s, price=%s WHERE users_id=%s"
                cursor.execute(
                    query, (tripId, bookingDate, bookingTime, bookingPrice, users_id))
                conn.commit()

            return jsonify({
                "ok": True
            }), 200

        else:
            return jsonify({
                "error": True,
                "message": "請登入系統後再操作"
            }), 403
    except mysql.connector.Error as err:
        print("MySQL error:",err)
        return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500
    finally:
        cursor.close()
        conn.close()


# 取得尚未下單的預定行程
@app.route("/api/booking", methods=["GET"])
def order_not_confirmed():
    try:
        # 確認使用者登入狀態
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        token = request.headers.get("Authorization")
        if token:
            token = token.split("Bearer ")[-1]
            user = jwt.decode(token, key, algorithms="HS256")
            users_id = user["id"]
            query = "SELECT booking.id, trip_id, name, address, images, date, time, price FROM booking INNER JOIN trip ON trip.id = booking.trip_id WHERE users_id = %s"
            cursor.execute(query, (users_id,))
            has_booking = cursor.fetchone()
            if (has_booking):
                return jsonify({
                    "data": {
                        "attraction": {
                            "id": has_booking[1],
                            "name": has_booking[2],
                            "address": has_booking[3],
                            "image": has_booking[4].split(',')[0]
                        },
                        "date": str(has_booking[5]),
                        "time": has_booking[6],
                        "price": has_booking[7]
                    }
                }), 200
            else:
                return jsonify({
                    "data": None,
                    "message": "沒有預定行程的資料"
                })
        else:
            return jsonify({
                "error": True,
                "message": "請登入系統後再操作"
            }), 403
    except mysql.connector.Error as err:
        return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500
    finally:
        cursor.close()
        conn.close()


# 刪除預定資料
@app.route("/api/booking", methods=["DELETE"])
def delete_booking():
    try:
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        token = request.headers.get("Authorization")
        if token:
            token = token.split("Bearer ")[-1]
            user = jwt.decode(token, key, algorithms="HS256")
            print(user)
            users_id = user["id"]
            query = "DELETE FROM booking WHERE users_id=%s"
            cursor.execute(query, (users_id,))
            conn.commit()
            return jsonify({
                "ok":True
            }),200
        else:
            return jsonify({
                "error": True,
                "message": "請登入系統後再操作"
            }), 403

    except mysql.connector.Error as err:
        return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500
    finally:
        cursor.close()
        conn.close()




# 建立訂單並付款
@app.route("/api/orders", methods=["POST"])
def place_an_order():
    try:
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        token = request.headers.get("Authorization")
        if token:
            token = token.split("Bearer ")[-1]
            user = jwt.decode(token, key, algorithms="HS256")
            users_id = user["id"]
            data = request.get_json()
            prime = data["prime"]
            price = data["order"]["price"]
            attraction_id = data["order"]["trip"]["attraction"]["id"]
            order_date = data["order"]["trip"]["date"]
            order_time = data["order"]["trip"]["time"]
            contact_name = data["order"]["contact"]["name"]
            contact_mail = data["order"]["contact"]["email"]
            contact_phone = data["order"]["contact"]["phone"]

            now = datetime.now()
            order_number = now.strftime("%Y%m%d%H%M%S") + str(uuid.uuid4())


            if contact_name == "" or contact_mail == "" or contact_phone == "":
                return jsonify({
                    "error": True,
                    "message": "請先將資料填妥再進行交易"
                })
            
            query = "DELETE FROM booking WHERE users_id =%s "
            cursor.execute(query, (users_id,))
            conn.commit()

            query = "INSERT INTO orders (users_id, trip_id, date, time, price, contact_name, contact_mail, contact_phone, order_number, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, '未付款')"
            cursor.execute(query, (users_id, attraction_id, order_date, order_time, price, contact_name, contact_mail, contact_phone, order_number))
            conn.commit()

            tappay_url = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"

            tappay_data = {
                "prime": prime,  
                "partner_key": partner_key,  
                "merchant_id": "leftleft10_NCCC", 
                "details": "Taipei Trip Test",
                "amount": price,  
                "cardholder": {
                    "phone_number": contact_phone,
                    "name": contact_name,
                    "email": contact_mail

                },
                "remember": True
            }
            print(tappay_data)

            headers = {
                "Content-Type": "application/json",
                "x-api-key":partner_key
            }

            response = requests.post(tappay_url, json=tappay_data, headers=headers,timeout=30)
            result = response.json()

            # print("Status Code:", response.status_code)
            print("Response JSON:",result)


            if result["status"] == 0:
                query = "UPDATE orders SET status=%s WHERE order_number=%s"
                cursor.execute(query, ("已付款", order_number))
                conn.commit()

                return jsonify({
                    "data": {
                        "number": order_number,
                        "payment": {
                            "status": 0,
                            "message": "付款成功"
                        }
                    }
                }), 200

            else:
                return jsonify({
                    "data":{
                        "number":order_number,
                        "payment":{
                            "status":result["status"],
                            "message":"付款失敗"
                        }
                    }
                }),400      


        else:
            return jsonify({
                "error": True,
                "message": "請先登入系統再操作"
            }), 403

    except mysql.connector.Error as err:
        return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500
    finally:
        conn.close()
        cursor.close()


@app.route("/api/order")
def get_ordernumber():
    try:
        conn = connection_pool.get_connection()
        cursor = conn.cursor()
        #確認使用者是否有登入
        token = request.headers.get("Authorization")
        print(token)
        if token:
            token = token.split("Bearer ")[-1]
            user = jwt.decode(token, key, algorithms="HS256")
            users_id = user["id"]
            print(users_id)
            #如果有登入就去抓order table + trip table的資料
            query="SELECT order_number,price, trip_id, date, time, contact_name ,contact_mail ,contact_phone ,status,name, address, images FROM orders inner join trip ON trip.id = orders.trip_id WHERE users_id =%s"
            cursor.execute(query,(users_id,))
            has_order=cursor.fetchall()
            print(has_order)
            orders_data=[]
            for order in has_order:
                order_dict={
                    "data": {
                        "number": order[0],
                        "price": order[1],
                        "trip": {
                        "attraction": {
                            "id": order[2],
                            "name": order[9],
                            "address": order[10],
                            "image": order[11].split(',')[0],
                        },
                        "date": str(order[3]),
                        "time": order[4]
                        },
                        "contact": {
                        "name": order[5],
                        "email": order[6],
                        "phone": order[7]
                        },
                        "status": order[8]
                    }
                    
                }
                orders_data.append(order_dict)
                # print(orders_data)
            return jsonify(
                orders_data),200
        else:
            return jsonify({
                "error":True,
                "message":"請登入後再進行操作"
            }),403


    except mysql.connector.Error as err:
                return jsonify({
            "error": True,
            "message": "伺服器內部錯誤"
        }), 500
    finally:
        conn.close()
        cursor.close()



app.run(host="0.0.0.0", port=3000)
