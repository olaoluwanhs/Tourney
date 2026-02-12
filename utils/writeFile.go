package utils

import "os"

func WriteFile(filename string, data []byte) {
	// Write the data to the file
	err := os.WriteFile(filename, data, 0644)
	if err != nil {
		panic(err)
	}
}
