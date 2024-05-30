import os
import io
import re
import logging
import PIL.Image as PIL_Image
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy import desc
from hashlib import sha256
from dotenv import load_dotenv
from base64 import encodebytes
from dyprocessor import DyProcessor, disc
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from datetime import datetime, timedelta
from logging.handlers import RotatingFileHandler

#basic app configuration
load_dotenv()
app = Flask(__name__)
auth = HTTPBasicAuth()
cors = CORS(app)
cors = CORS(app, origins="*")
scheduler = BackgroundScheduler(daemon=True)

log_formatter = logging.Formatter("%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger()
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)

max_length_handler = RotatingFileHandler(filename="record.log", mode='a', maxBytes=10*1024*1024, backupCount=2, encoding=None, delay=0)
max_length_handler.setFormatter(log_formatter)
logger.addHandler(max_length_handler)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_CONNECTION_STRING')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('TOKEN_ENCRYPTION')

db = SQLAlchemy(app)

STATUS_OK = 'OK'
STATUS_NOK = 'NOK'
PSW_PATTERN = re.compile("^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$")

#database structure declaration
class User(db.Model):
    username = db.Column(db.String(20), primary_key=True)
    password = db.Column(db.String(64).with_variant(CHAR(64),"mysql", "mariadb"))
    albums = db.relationship('Album', backref='user')

    def __repr__(self):
        return f'<User: {self.username}>'
    
    def verify_password(self, password):
        password = sha256(password.encode('utf-8')).hexdigest()
        return password == self.password
    
    def create_auth_token(self, expiration = 1000 * 3600 * 24 * 30):
        token = Serializer(app.config['SECRET_KEY'], expires_in=expiration)
        return token.dumps({ 'username': self.username })
    
    @staticmethod
    def verify_auth_token(token):
        s = Serializer(app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None # valid token, but expired
        except BadSignature:
            return None # invalid token
        user = User.query.filter_by(username = data['username']).one()
        return user
    
class Album(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_fk = db.Column(db.String(20), db.ForeignKey('user.username'))
    date_upload = db.Column(db.DateTime)
    images = db.relationship('Image', cascade="all,delete", backref='album')

    def __repr__(self):
        return f'<Album: {self.id}, User: {self.user_fk}, Created: {self.date_upload}>'
    
class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ref_image = db.Column(db.LargeBinary(length=(2**32)-1))
    type_dyschromatopsia = db.Column(db.String(15))
    album_id = db.Column(db.Integer, db.ForeignKey('album.id'))
    
    def __repr__(self):
        return f'<Image: {self.id}, Type: {self.type_dyschromatopsia}, Album: {self.album_id}>'
    
    def convert_to_json(self):
        new_image = PIL_Image.open(io.BytesIO(self.ref_image))

        img_bytes = io.BytesIO()
        new_image.save(img_bytes, format=new_image.format)
        new_image = encodebytes(img_bytes.getvalue()).decode('ascii')

        return{
            "id": self.id,
            "ref_image": new_image,
            "type_dyschromatopsia": self.type_dyschromatopsia,
            "album_id": self.album_id
        }

#create database structure
with app.app_context():
    db.create_all()

# this function is used for check if the authentication for the routes is valid
@auth.verify_password
def verify_password(username_or_token, password):
    # check authentication with token
    user = User.verify_auth_token(username_or_token)
    if not user:
        # check authentication with username and password
        user = User.query.filter_by(username = username_or_token).first()
        if not user or not user.verify_password(password):
            return False
    g.user = user
    return True

# this route is used for get the token to use for the requests
@app.route('/login')
@auth.login_required
def get_auth_token():
    token = g.user.create_auth_token()
    app.logger.info(f'user {g.user.username} logged in from {request.remote_addr}')
    return jsonify({ "status": STATUS_OK, "token": token.decode('ascii'), "username": g.user.username})

# this route is used for create an user  
@app.route('/createuser', methods=['POST'])
def create_user():
    username = request.form['username']
    password = request.form['password']

    if len(username) > 4:
        if len(username) < 21:
            if(PSW_PATTERN.match(password)):
                user_already_exist = bool(User.query.filter_by(username=username).first())
                if not user_already_exist:
                    password = sha256(password.encode('utf-8')).hexdigest()

                    new_user = User(username = username, password = password)
                    db.session.add(new_user)
                    db.session.commit()

                    return jsonify({"status": STATUS_OK})
                else:
                    app.logger.warning("Someone tried to create an account that already exist")
                    return jsonify({"status": STATUS_NOK, "message":"Already-exist"})
            else:
                app.logger.warning("Someone tried to use an invalid password")
                return jsonify({"status": STATUS_NOK, "message": "Password-Invalid"})
        else:
            app.logger.warning(f"Someone tried to use a long username with length {len(username)}")
            return jsonify({"status": STATUS_NOK, "message": "Username-long"})
    else:
        app.logger.warning(f"Someone tried to use a short username with length {len(username)}")
        return jsonify({"status": STATUS_NOK, "message": "Username-short"})

# this route generate images and save them inside the db
@app.route('/generate', methods=['POST'])
@auth.login_required
def generate_images():
    try:
        img = request.files['img']
        user = g.user.username
        types = request.form.getlist('types')

        img = PIL_Image.open(img, mode='r')
        img_original = io.BytesIO()
        img.save(img_original, format=img.format)
        img_original = img_original.getvalue()

        dp = DyProcessor()
        dp.loadImage(img)

        album_id = create_album(user)
        upload_image(img_original, 'original', album_id)

        app.logger.info(f'image to process for user {user} from {request.remote_addr}')

        images = []
        for i in types:
            i = int(i)
            app.logger.info(f'start processing image with {disc[i]}')
            new_image = dp.processImage(i)

            img_bytes = io.BytesIO()
            new_image.save(img_bytes, format=new_image.format)

            #image converted in Binary for save in db
            new_img_bytes = img_bytes.getvalue()

            # image converted in Base64 for return to the user
            encoded_img = encodebytes(img_bytes.getvalue()).decode('ascii')

            upload_image(new_img_bytes, disc[i][0], album_id)
            app.logger.info(f'image proccessed with {disc[i]}')
            img_object = {"img": encoded_img, "type": i}
            images.append(img_object)

        app.logger.info("finished to proccess image")
        return jsonify({"status": STATUS_OK, "images": images})
    except:
        return jsonify({"status": STATUS_NOK, "message": "Error-Image"})

# this route do the same thing as the route /generate but it doesn't require authentication beacause it doesn't save anything on db
@app.route('/generatenoaccount', methods=['POST'])
def generate_images_no_account():
    try:
        img = request.files['img']
        types = request.form.getlist('types')

        img = PIL_Image.open(img, mode='r')
        img_original = io.BytesIO()
        img.save(img_original, format=img.format)
        dp = DyProcessor()
        dp.loadImage(img)

        images = []

        app.logger.info(f'image to process without user from {request.remote_addr}')

        for i in types:
            i = int(i)
            app.logger.info(f'start processing image with {disc[i]}')
            new_image = dp.processImage(i)
            
            img_bytes = io.BytesIO()
            new_image.save(img_bytes, format=new_image.format)

            # image converted in Base64 for return to the user
            encoded_img = encodebytes(img_bytes.getvalue()).decode('ascii')
            app.logger.info(f'image proccessed with {disc[i]}')
            img_object = {"img": encoded_img, "type": i}
            images.append(img_object)

        app.logger.info("finished to proccess image")
        return jsonify({"status": STATUS_OK, "images": images})
    except:
        return jsonify({"status": STATUS_NOK, "message": "Error-Image"})

#this route is used for remove an album from the db  
@app.route('/remove', methods=['DELETE'])
@auth.login_required
def remove_image():
    id_user = request.form['id']
    app.logger.info(f'album to remove: {id_user}')
    try:
        album = Album.query.filter_by(id=id_user, user_fk=g.user.username).one()
        db.session.delete(album)
        db.session.commit()

        app.logger.info('album successfully removed')
        return jsonify({"status": STATUS_OK})
    except:     
        app.logger.error('user not authorized to remove this album')
        return jsonify({"status": STATUS_NOK, "message":"Impossible-remove"})

# this route is used for get some elements from the history using a pagination system for dynamic load the history on the website
@app.route('/history/<page>', methods=['GET'])
@auth.login_required
def get_history(page):
    page = int(page)
    per_page = 5
    username = g.user.username
    app.logger.info(f'fetch history for {username} from {request.remote_addr}')
    history = []

    try:
        albums = Album.query.filter_by(user_fk=username).order_by(desc(Album.date_upload)).paginate(page=page, per_page=per_page)
        for album in albums:
            images = Image.query.filter_by(album_id=album.id)
            img_arr = []
            for img in images:
                img_arr.append(img.convert_to_json())
            history.append({"images": img_arr, "date_upload": album.date_upload})
        return jsonify({"status": STATUS_OK, "history":history})
    except:
        return jsonify({"status": STATUS_NOK, "message": "No-more-history-values"})

# this route is used as a workaround for the scheduled task beacause it doesn't work inside the docker container
@app.route('/removeold', methods=['DELETE'])
@auth.login_required
def remove_old_route():
    remove_old()
    return jsonify({"status": STATUS_OK})

# this function is used for create an album inside the db
def create_album(user):
    new_album = Album(user_fk = user, date_upload = datetime.now())
    db.session.add(new_album)
    db.session.commit()

    app.logger.info(f'new album id {new_album.id} created by {user}')
    
    return new_album.id

# this function is used for upload an image inside the db
def upload_image(image, type, album):
    new_image = Image(ref_image = image, type_dyschromatopsia = type, album_id=album)

    db.session.add(new_image)
    db.session.commit()

    app.logger.info(f'image succesfuly uploaded on database in album {album} with type {type}')

    return jsonify({"status": STATUS_OK})

# this function check if there are albums older than 30 days. If there are it remove them from the database
def remove_old():
    app.logger.info("scheduled task running")
    with app.app_context():
        albums = Album.query.all()
        limit = datetime.today() - timedelta(days=30)
        for alb in albums:
            app.logger.info(alb)
            if alb.date_upload < limit:
                app.logger.info(f"remove album with id: {alb.id}")
                db.session.delete(alb)
        db.session.commit()

if __name__ == "__main__":
    scheduler.add_job(id="remove", func=remove_old, trigger="interval", days=1)
    scheduler.start()
    app.run(host='0.0.0.0',port=5000, debug=True)