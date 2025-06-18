import os
import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    """Create a database connection to the SQLite database."""
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        print(f"Connected to SQLite database: {db_file}")
        return conn
    except Error as e:
        print(e)
    return conn

def get_table_info(conn, table_name):
    """Get information about table columns."""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    return columns

def rename_column(conn, table_name, old_column, new_column):
    """Rename a column in a table."""
    try:
        # Check if the old column exists
        columns = get_table_info(conn, table_name)
        column_names = [col[1] for col in columns]
        
        if old_column in column_names and new_column not in column_names:
            print(f"Renaming column {old_column} to {new_column}...")
            
            # Create a new table with the desired schema
            cursor = conn.cursor()
            
            # Get all column definitions
            columns_sql = []
            for col in columns:
                name = col[1]
                type_name = col[2]
                not_null = "NOT NULL" if col[3] else ""
                default = f"DEFAULT {col[4]}" if col[4] is not None else ""
                primary_key = "PRIMARY KEY" if col[5] else ""
                
                if name == old_column:
                    name = new_column
                
                columns_sql.append(f"{name} {type_name} {not_null} {default} {primary_key}".strip())
            
            # Create new table
            new_table_name = f"{table_name}_new"
            create_table_sql = f"CREATE TABLE {new_table_name} ({', '.join(columns_sql)})"
            cursor.execute(create_table_sql)
            
            # Map old column names to new column names
            old_columns = [col[1] for col in columns]
            new_columns = [new_column if col == old_column else col for col in old_columns]
            
            # Copy data
            copy_sql = f"INSERT INTO {new_table_name} ({', '.join(new_columns)}) SELECT {', '.join(old_columns)} FROM {table_name}"
            cursor.execute(copy_sql)
            
            # Drop old table
            cursor.execute(f"DROP TABLE {table_name}")
            
            # Rename new table
            cursor.execute(f"ALTER TABLE {new_table_name} RENAME TO {table_name}")
            
            conn.commit()
            print(f"Successfully renamed column {old_column} to {new_column} in table {table_name}")
            return True
        elif new_column in column_names:
            print(f"Column {new_column} already exists in table {table_name}")
            return True
        else:
            print(f"Column {old_column} not found in table {table_name}")
            return False
    except Error as e:
        print(f"Error renaming column: {e}")
        return False

def main():
    """Main function to update the database schema."""
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_file = os.path.join(basedir, "blood_donor.db")
    
    # Create a database connection
    conn = create_connection(db_file)
    
    if conn is not None:
        # Check if city column exists and District doesn't
        columns = get_table_info(conn, "users")
        column_names = [col[1] for col in columns]
        print("Current columns:", column_names)
        
        if "city" in column_names and "District" not in column_names:
            # Rename the column
            rename_column(conn, "users", "city", "District")
        else:
            if "District" in column_names:
                print("Schema is already up to date with 'District' column.")
            elif "city" not in column_names:
                print("Neither 'city' nor 'District' column found. Check the database schema.")
        
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == "__main__":
    main()
