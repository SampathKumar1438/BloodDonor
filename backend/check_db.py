import os
from app_new import app, db, User

def check_database():
    with app.app_context():
        # Check if the database file exists
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        print(f"Database path: {db_path}")
        print(f"Full database path: {os.path.abspath(db_path)}")
        print(f"Database file exists: {os.path.exists(db_path)}")
        print(f"Current working directory: {os.getcwd()}")
        
        # Create tables if they don't exist
        print("Creating tables...")
        db.create_all()
        
        # Check if users exist
        user_count = User.query.count()
        print(f"Number of users in database: {user_count}")
        
        if user_count > 0:
            print("\nSample users:")
            for user in User.query.limit(3).all():
                print(f"ID: {user.id}, Name: {user.name}, Blood Group: {user.blood_group}, City: {user.city}")
                print(f"Email: {user.email}, Phone: {user.phone}")
                print(f"Location: Lat={user.latitude}, Lon={user.longitude}")
                print("---")

if __name__ == "__main__":
    check_database()
