package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type Reminder struct {
	ID          int
	UserID      int
	MedicineID  int
	ScheduledAt time.Time
	Channel     string
	Status      string
	MedName     string
}

func loadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}

func getDBConnString() string {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgresql://postgres:postgres@localhost:5432/medgraph_db?sslmode=disable"
	}
	return connStr
}

func connectDB() (*sql.DB, error) {
	connStr := getDBConnString()
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Ping check
	err = db.Ping()
	if err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

func processDueReminders(db *sql.DB) error {
	// Query reminders where scheduled_at is less than or equal to current time, and status is pending
	query := `
		SELECT r.id, r.user_id, r.medicine_id, r.scheduled_at, r.channel, r.status, m.name
		FROM reminders r
		JOIN medicines m ON r.medicine_id = m.id
		WHERE r.status = 'pending' AND r.scheduled_at <= $1
	`
	rows, err := db.Query(query, time.Now())
	if err != nil {
		return fmt.Errorf("error querying reminders: %w", err)
	}
	defer rows.Close()

	var dueReminders []Reminder
	for rows.Next() {
		var r Reminder
		err := rows.Scan(&r.ID, &r.UserID, &r.MedicineID, &r.ScheduledAt, &r.Channel, &r.Status, &r.MedName)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		dueReminders = append(dueReminders, r)
	}

	if len(dueReminders) == 0 {
		return nil
	}

	log.Printf("Found %d pending reminders to dispatch", len(dueReminders))

	for _, rem := range dueReminders {
		// 1. Simulate notification sending based on user channel
		dispatchNotification(rem)

		// 2. Update status in database to 'sent'
		updateQuery := "UPDATE reminders SET status = 'sent' WHERE id = $1"
		_, err := db.Exec(updateQuery, rem.ID)
		if err != nil {
			log.Printf("Failed to update reminder status in DB for ID %d: %v", rem.ID, err)
		} else {
			log.Printf("Updated reminder ID %d status to 'sent' in DB", rem.ID)
		}
	}

	return nil
}

func dispatchNotification(rem Reminder) {
	fmt.Printf("\n==================================================\n")
	fmt.Printf("🚨 MEDICATION ALERT DISPATCHED\n")
	fmt.Printf("📅 Time:     %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("👤 Patient ID: %d\n", rem.UserID)
	fmt.Printf("💊 Medicine:  %s (ID: %d)\n", rem.MedName, rem.MedicineID)
	fmt.Printf("📲 Channel:   %s\n", rem.Channel)
	fmt.Printf("💬 Message:   \"Hi! It is time to take your %s. Please log in to mark it as Taken.\"\n", rem.MedName)
	fmt.Printf("==================================================\n\n")
}

func main() {
	loadEnvFile(".env")
	loadEnvFile("../.env")
	log.Println("Starting MedGraph AI Reminder Scheduler in Go...")
	
	var db *sql.DB
	var err error

	// Retry connection loop
	for {
		db, err = connectDB()
		if err != nil {
			log.Printf("Database connection failed (%v). Retrying in 5 seconds...", err)
			time.Sleep(5 * time.Second)
			continue
		}
		break
	}
	defer db.Close()
	log.Println("Database connection established successfully.")

	// Periodic check ticker
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		err := processDueReminders(db)
		if err != nil {
			log.Printf("Error processing reminders: %v", err)
			// Re-verify connection on error
			if errPing := db.Ping(); errPing != nil {
				log.Println("Database connection lost. Reconnecting...")
				db.Close()
				for {
					db, err = connectDB()
					if err == nil {
						log.Println("Database reconnected.")
						break
					}
					time.Sleep(3 * time.Second)
				}
			}
		}
	}
}
