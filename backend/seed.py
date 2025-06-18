from app_new import app, db, User

def seed_database():
    """Populate database with sample data"""
    print("Seeding database...")
    
    # List of sample users
    users = [
        User(
            name="John Doe",
            email="john@example.com",
            phone="123-456-7890",
            blood_group="A+",
            District="New York",
            latitude=40.7128,
            longitude=-74.0060
        ),
        User(
            name="Jane Smith",
            email="jane@example.com",
            phone="987-654-3210",
            blood_group="O-",
            District="Los Angeles",
            latitude=34.0522,
            longitude=-118.2437
        ),
        User(
            name="Mike Johnson",
            email="mike@example.com",
            phone="555-123-4567",
            blood_group="B+",
            District="Chicago",
            latitude=41.8781,
            longitude=-87.6298
        ),
        User(
            name="Sarah Wilson",
            email="sarah@example.com",
            phone="555-987-6543",
            blood_group="AB+",
            District="New York",
            latitude=40.7308,
            longitude=-73.9975
        ),
        User(
            name="David Brown",
            email="david@example.com",
            phone="555-789-0123",
            blood_group="A+",
            District="Chicago",
            latitude=41.8840,
            longitude=-87.6532
        ),
        User(
            name="Emily Davis",
            email="emily@example.com",
            phone="555-456-7890",
            blood_group="O+",
            District="Los Angeles",
            latitude=34.0480,
            longitude=-118.2702
        ),
        User(
            name="Robert Miller",
            email="robert@example.com",
            phone="555-321-6547",
            blood_group="B-",
            District="New York",
            latitude=40.7589,
            longitude=-73.9851
        ),
        User(
            name="Lisa Garcia",
            email="lisa@example.com",
            phone="555-852-9631",
            blood_group="AB-",
            District="Chicago",
            latitude=41.8675,
            longitude=-87.6167
        ),
        User(
            name="James Rodriguez",
            email="james@example.com",
            phone="555-159-7536",
            blood_group="A-",
            District="Los Angeles",
            latitude=34.0825,
            longitude=-118.2439
        ),
        User(
            name="Michelle Lee",
            email="michelle@example.com",
            phone="555-357-9514",
            blood_group="O+",
            District="New York",
            latitude=40.7769,
            longitude=-73.9822
        )
    ]
    
    # Add users to database
    with app.app_context():
        # First check if database is empty
        existing_users = User.query.count()
        if existing_users > 0:
            print("Database already contains data. Skipping seed.")
            return
        
        for user in users:
            db.session.add(user)
        
        db.session.commit()
        print(f"Added {len(users)} sample users to the database")

if __name__ == '__main__':
    seed_database()
