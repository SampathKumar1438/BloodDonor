from app_fixed import app, db, User

def seed_database():
    """Populate database with sample data with Indian districts"""
    print("Seeding database with Indian districts data...")
    
    # List of sample users with Indian districts
    users = [
        User(
            name="Rahul Sharma",
            email="rahul@example.com",
            phone="999-888-7777",
            blood_group="A+",
            District="Mumbai",
            latitude=19.0760,
            longitude=72.8777
        ),
        User(
            name="Priya Patel",
            email="priya@example.com",
            phone="888-777-6666",
            blood_group="O+",
            District="Delhi",
            latitude=28.7041,
            longitude=77.1025
        ),
        User(
            name="Amit Kumar",
            email="amit@example.com",
            phone="777-666-5555",
            blood_group="B+",
            District="Bengaluru Urban",
            latitude=12.9716,
            longitude=77.5946
        ),
        User(
            name="Sneha Reddy",
            email="sneha@example.com",
            phone="666-555-4444",
            blood_group="AB-",
            District="Hyderabad",
            latitude=17.3850,
            longitude=78.4867
        ),
        User(
            name="Ravi Verma",
            email="ravi@example.com",
            phone="555-444-3333",
            blood_group="O-",
            District="Chennai",
            latitude=13.0827,
            longitude=80.2707
        ),
        User(
            name="Ananya Singh",
            email="ananya@example.com",
            phone="444-333-2222",
            blood_group="A-",
            District="Kolkata",
            latitude=22.5726,
            longitude=88.3639
        ),
        User(
            name="Vijay Menon",
            email="vijay@example.com",
            phone="333-222-1111",
            blood_group="B-",
            District="Pune",
            latitude=18.5204,
            longitude=73.8567
        ),
        User(
            name="Meera Iyer",
            email="meera@example.com",
            phone="222-111-0000",
            blood_group="AB+",
            District="Ahmedabad",
            latitude=23.0225,
            longitude=72.5714
        ),
        User(
            name="Arjun Nair",
            email="arjun@example.com",
            phone="111-000-9999",
            blood_group="A+",
            District="Jaipur",
            latitude=26.9124,
            longitude=75.7873
        ),
        User(
            name="Pooja Gupta",
            email="pooja@example.com",
            phone="000-999-8888",
            blood_group="O+",
            District="Lucknow",
            latitude=26.8467,
            longitude=80.9462
        ),
        User(
            name="Karthik Reddy",
            email="karthik@example.com",
            phone="123-456-7890",
            blood_group="A+",
            District="Coimbatore",
            latitude=11.0168,
            longitude=76.9558
        ),
        User(
            name="Anjali Sharma",
            email="anjali@example.com",
            phone="456-789-0123",
            blood_group="B+",
            District="Nagpur",
            latitude=21.1458,
            longitude=79.0882
        ),
        User(
            name="Rajesh Kumar",
            email="rajesh@example.com",
            phone="789-012-3456",
            blood_group="AB+",
            District="Indore",
            latitude=22.7196,
            longitude=75.8577
        ),
        User(
            name="Divya Patel",
            email="divya@example.com",
            phone="234-567-8901",
            blood_group="O-",
            District="Bhopal",
            latitude=23.2599,
            longitude=77.4126
        ),
        User(
            name="Arun Nair",
            email="arun@example.com",
            phone="345-678-9012",
            blood_group="A-",
            District="Patna",
            latitude=25.5941,
            longitude=85.1376
        )
    ]
    
    # Add users to database
    with app.app_context():
        # Clear existing data
        db.session.query(User).delete()
        db.session.commit()
        
        # Add new users
        for user in users:
            db.session.add(user)
        
        db.session.commit()
        print(f"Added {len(users)} sample users with Indian districts to the database")

if __name__ == '__main__':
    seed_database()
