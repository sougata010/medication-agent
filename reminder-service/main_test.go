package main

import (
	"os"
	"testing"
)

func TestGetDBConnStringDefault(t *testing.T) {
	// Temporarily clear env
	os.Unsetenv("DATABASE_URL")
	
	expected := "postgresql://postgres:postgres@localhost:5432/medgraph_db?sslmode=disable"
	driver, actual := getDBConnInfo()
	
	if actual != expected {
		t.Errorf("Expected %s, got %s", expected, actual)
	}
	if driver != "postgres" {
		t.Errorf("Expected postgres driver, got %s", driver)
	}
}

func TestGetDBConnStringCustom(t *testing.T) {
	customURL := "postgresql://testuser:testpass@remotetest:5432/testdb"
	os.Setenv("DATABASE_URL", customURL)
	defer os.Unsetenv("DATABASE_URL")
	
	driver, actual := getDBConnInfo()
	
	if actual != customURL {
		t.Errorf("Expected %s, got %s", customURL, actual)
	}
	if driver != "postgres" {
		t.Errorf("Expected postgres driver, got %s", driver)
	}
}
