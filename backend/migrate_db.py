import sqlite3

for db_path in ['vaayil.db', 'backend/vaayil.db']:
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    
    # Check users columns
    user_cols = [c[1] for c in cur.execute('PRAGMA table_info(users)').fetchall()]
    if 'phone' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20)")
        print(f"{db_path}: added phone to users")
    if 'is_active' not in user_cols:
        cur.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        print(f"{db_path}: added is_active to users")
        
    # Check alerts columns
    alert_cols = [c[1] for c in cur.execute('PRAGMA table_info(alerts)').fetchall()]
    if 'severity' not in alert_cols:
        cur.execute("ALTER TABLE alerts ADD COLUMN severity VARCHAR(20) DEFAULT 'high'")
        print(f"{db_path}: added severity to alerts")
    if 'is_dev_sample' not in alert_cols:
        cur.execute("ALTER TABLE alerts ADD COLUMN is_dev_sample BOOLEAN DEFAULT 0")
        print(f"{db_path}: added is_dev_sample to alerts")
        
    con.commit()
    con.close()
print("Migration completed successfully!")

