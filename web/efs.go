package web

import (
	"crypto/sha256"
	"embed"
	"fmt"
	"io/fs"
)

//go:embed "assets"
var Files embed.FS

var AssetsVersion = func() string {
	h := sha256.New()
	_ = fs.WalkDir(Files, "assets", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		data, err := Files.ReadFile(path)
		if err != nil {
			return err
		}
		_, _ = h.Write([]byte(path))
		_, _ = h.Write(data)
		return nil
	})
	return fmt.Sprintf("%x", h.Sum(nil))[:12]
}()
