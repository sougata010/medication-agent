import sqlite3

def clean_database():
    conn = sqlite3.connect('medgraph.db')
    c = conn.cursor()
    c.execute("""
        UPDATE conversation_sessions 
        SET summary = 'Clinical Pharmacotherapy Consultation' 
        WHERE summary LIKE '%failed to synthesi%' 
           OR summary LIKE '%MedGraph AI%'
           OR summary LIKE '%specialized agent server%'
    """)
    conn.commit()
    print("Cleaned database sessions:", c.rowcount)
    conn.close()

if __name__ == '__main__':
    clean_database()

