import os
import subprocess
import getpass

def run_setup():
    print("=" * 60)
    print("      JanMithra MySQL Database Setup Runner")
    print("=" * 60)
    
    mysql_path = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if not os.path.exists(mysql_path):
        print(f"[ERROR] mysql.exe not found at: {mysql_path}")
        return

    sql_file = os.path.abspath("JanMithra_setup.sql")
    if not os.path.exists(sql_file):
        print(f"[ERROR] JanMithra_setup.sql not found at: {sql_file}")
        return

    print("\nThis script will execute JanMithra_setup.sql to create and populate")
    print("the database and tables in your MySQL Server.")
    
    password = getpass.getpass("Enter MySQL root password: ")
    
    cmd = [
        mysql_path,
        "-u", "root",
        f"-p{password}",
        "-e", f"source {sql_file.replace(os.sep, '/')}"
    ]
    
    print("\nExecuting setup script into MySQL...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if res.returncode == 0:
        print("\n[SUCCESS] JanMithra database and tables created successfully!")
        print("Tables created:")
        print(" - users (with login/signup credentials and farmer profiles)")
        print(" - schemes (with government subsidy & eligibility metadata)")
        print(" - document_verifications (OCR vision records)")
        print(" - peer_success_stories (geospatial nearby farmers)")
        print(" - chat_logs (conversational history)")
        print("\nOutput from MySQL:")
        print(res.stdout)
    else:
        print("\n[ERROR] Failed to execute setup script:")
        print(res.stderr)
        print("\nYou can also open MySQL Workbench, open the SQL Editor for 'JanMithra',")
        print("open 'JanMithra_setup.sql', and click the Execute (lightning) button.")

if __name__ == "__main__":
    run_setup()
