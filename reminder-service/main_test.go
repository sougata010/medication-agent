package main

import (
	"os"
	"testing"
)

func TestGetDBConnString_Default(t *testing.T) {
	// Clear env variable
	os.Unsetenv("DATABASE_URL")
	
	expected := "postgresql://postgres:postgres@localhost:5432/medgraph_db?sslmode=disable"
	actual := getDBConnString()
	
	if actual != expected {
		t.Errorf("Expected connection string to be %s, but got %s", expected, actual)
	}
}

func TestGetDBConnString_Custom(t *testing.T) {
	customURL := "postgresql://testuser:testpass@remotetest:5432/testdb"
	os.Setenv("DATABASE_URL", customURL)
	defer os.Unsetenv("DATABASE_URL")
	
	actual := getDBConnString()
	
	if actual != customURL {
		t.Errorf("Expected connection string to be %s, but got %s", customURL, actual)
	}
}
