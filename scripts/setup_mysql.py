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

    migrations_dir = os.path.abspath(os.path.join("database", "migrations"))
    migrations = sorted(
        os.path.join(migrations_dir, f) for f in os.listdir(migrations_dir) if f.endswith(".sql")
    ) if os.path.isdir(migrations_dir) else []

    print("\nThis script runs JanMithra_setup.sql (non-destructive: it never drops")
    print("tables or deletes data) and then applies every migration in database/migrations.")
    print("Tip: you can also run `npm run db:setup` from the frontend folder.")

    password = getpass.getpass("Enter MySQL root password: ")
    # Pass the password through the environment instead of the command line.
    env = dict(os.environ, MYSQL_PWD=password)

    def run(sql_path, database=None):
        cmd = [mysql_path, "-u", "root"]
        if database:
            cmd += ["-D", database]
        cmd += ["-e", f"source {sql_path.replace(os.sep, '/')}"]
        return subprocess.run(cmd, capture_output=True, text=True, env=env)

    print("\nExecuting setup script into MySQL...")
    res = run(sql_file)
    if res.returncode != 0:
        print("\n[ERROR] Failed to execute setup script:")
        print(res.stderr)
        print("\nYou can also open MySQL Workbench, open 'JanMithra_setup.sql' and then each file in")
        print("database/migrations/, and click the Execute (lightning) button for each.")
        return

    for m in migrations:
        print(f"Applying migration {os.path.basename(m)} ...")
        res = run(m, "JanMithra")
        if res.returncode != 0:
            print(f"\n[ERROR] Migration {os.path.basename(m)} failed:")
            print(res.stderr)
            return
        print(res.stdout)

    print("\n[SUCCESS] JanMithra database is set up and up to date.")
    print("Tables: users, user_sessions, conversations, chat_logs (messages),")
    print("        schemes, document_verifications, peer_success_stories, schema_migrations")
    print("\nNo demo logins are created. Sign up from the app, or set a password for an")
    print("existing farmer record with: npm run user:set-password -- <mobile number>")


if __name__ == "__main__":
    run_setup()
