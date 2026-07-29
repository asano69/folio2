// Package imageproc resizes/recompresses JPEG and PNG images before they
// are stored, and provides the small set of helpers (size decoding,
// content hashing) around that step. It has no dependency on where an
// image comes from -- a folder import, a ZIP archive, or a direct API
// upload (see internal/importer and internal/serve's images upload
// hook) -- so all three share the exact same compression behavior.
package imageproc

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"log/slog"
	"path/filepath"
	"strings"

	_ "golang.org/x/image/webp" // registers the WebP format with image.DecodeConfig

	"github.com/asano69/folio/internal/errs"
)

const (
	maxWidthPx        = 1920
	compressThreshold = 300 * 1024 // 300 KB
	compressTarget    = 200 * 1024 // 200 KB
)

// isCompressibleImage returns true for JPEG and PNG files, the only
// formats this file knows how to re-encode. WebP images are left
// untouched (the standard library has no WebP encoder).
func isCompressibleImage(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png"
}

// CompressForStorage resizes/recompresses data if it is a JPEG or PNG
// that exceeds the thresholds below. Anything else -- a WebP image, or a
// JPEG/PNG that fails to decode/encode -- is returned unchanged; a
// compression failure should never abort an otherwise-valid save.
func CompressForStorage(data []byte, name string) ([]byte, string) {
	if !isCompressibleImage(name) {
		return data, name
	}
	processed, newName, _, err := processImage(data, name)
	if err != nil {
		slog.Warn("image compression failed, storing original", "file", name, "error", err)
		return data, name
	}
	return processed, newName
}

// DecodeSize returns the pixel width and height of image data.
func DecodeSize(data []byte) (width, height int, err error) {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return 0, 0, errs.Newf("decode image config: %v", err)
	}
	return cfg.Width, cfg.Height, nil
}

// HashBytes returns the hex-encoded SHA-256 digest of data, used as the
// images.hash value so identical image content is recognised regardless
// of which path it came in through (folder import, ZIP archive, or a
// direct API upload).
func HashBytes(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

// processImage resizes and/or compresses an image in memory.
// Returns processed bytes, the (possibly updated) filename, and a human-readable
// summary of what changed (empty string if nothing was done).
// If neither resize nor compression is needed, original bytes are returned unchanged.
func processImage(data []byte, name string) (out []byte, outName string, summary string, err error) {
	img, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, name, "", fmt.Errorf("decode: %w", err)
	}

	originalSize := len(data)
	bounds := img.Bounds()
	w := bounds.Dx()

	needResize := w > maxWidthPx
	needCompress := originalSize >= compressThreshold

	if !needResize && !needCompress {
		return data, name, "", nil
	}

	if needResize {
		h := bounds.Dy()
		newH := h * maxWidthPx / w
		img = resizeBilinear(img, maxWidthPx, newH)
	}

	encoded, encodedName, err := encodeImage(img, name, format, originalSize)
	if err != nil {
		return nil, name, "", err
	}

	summary = fmt.Sprintf("%s: %d KB -> %d KB", name, originalSize/1024, len(encoded)/1024)
	return encoded, encodedName, summary, nil
}

func encodeImage(img image.Image, name, format string, originalSize int) ([]byte, string, error) {
	switch format {
	case "jpeg":
		data, err := encodeJPEG(img, originalSize)
		return data, name, err
	case "png":
		return encodePNG(img, name, originalSize)
	default:
		return nil, name, fmt.Errorf("unsupported format: %s", format)
	}
}

func encodeJPEG(img image.Image, originalSize int) ([]byte, error) {
	if originalSize < compressThreshold {
		return jpegEncode(img, 90)
	}
	lo, hi := 1, 95
	var best []byte
	for lo <= hi {
		mid := (lo + hi) / 2
		buf, err := jpegEncode(img, mid)
		if err != nil {
			return nil, err
		}
		if len(buf) <= compressTarget {
			best = buf
			lo = mid + 1
		} else {
			hi = mid - 1
		}
	}
	if best == nil {
		return jpegEncode(img, 1)
	}
	return best, nil
}

func encodePNG(img image.Image, name string, originalSize int) ([]byte, string, error) {
	var buf bytes.Buffer
	enc := png.Encoder{CompressionLevel: png.BestCompression}
	if err := enc.Encode(&buf, img); err != nil {
		return nil, name, err
	}

	if buf.Len() < compressThreshold {
		return buf.Bytes(), name, nil
	}

	jpgData, err := encodeJPEG(img, originalSize)
	if err != nil {
		return nil, name, err
	}
	ext := filepath.Ext(name)
	jpgName := strings.TrimSuffix(name, ext) + ".jpg"
	return jpgData, jpgName, nil
}

func jpegEncode(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// resizeBilinear returns a new image scaled to (newW, newH) using bilinear
// interpolation. This is a pure standard-library implementation.
func resizeBilinear(src image.Image, newW, newH int) image.Image {
	bounds := src.Bounds()
	srcW := bounds.Dx()
	srcH := bounds.Dy()

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))

	xRatio := float64(srcW) / float64(newW)
	yRatio := float64(srcH) / float64(newH)

	for y := 0; y < newH; y++ {
		sy := (float64(y)+0.5)*yRatio - 0.5
		y0 := int(sy)
		y1 := y0 + 1
		fy := sy - float64(y0)
		if y0 < 0 {
			y0 = 0
		}
		if y1 >= srcH {
			y1 = srcH - 1
		}

		for x := 0; x < newW; x++ {
			sx := (float64(x)+0.5)*xRatio - 0.5
			x0 := int(sx)
			x1 := x0 + 1
			fx := sx - float64(x0)
			if x0 < 0 {
				x0 = 0
			}
			if x1 >= srcW {
				x1 = srcW - 1
			}

			c00 := toRGBAf(src.At(bounds.Min.X+x0, bounds.Min.Y+y0))
			c10 := toRGBAf(src.At(bounds.Min.X+x1, bounds.Min.Y+y0))
			c01 := toRGBAf(src.At(bounds.Min.X+x0, bounds.Min.Y+y1))
			c11 := toRGBAf(src.At(bounds.Min.X+x1, bounds.Min.Y+y1))

			r := blerp(c00[0], c10[0], c01[0], c11[0], fx, fy)
			g := blerp(c00[1], c10[1], c01[1], c11[1], fx, fy)
			b := blerp(c00[2], c10[2], c01[2], c11[2], fx, fy)
			a := blerp(c00[3], c10[3], c01[3], c11[3], fx, fy)

			dst.SetRGBA(x, y, color.RGBA{
				R: clamp(r), G: clamp(g), B: clamp(b), A: clamp(a),
			})
		}
	}
	return dst
}

func toRGBAf(c color.Color) [4]float64 {
	r, g, b, a := c.RGBA()
	return [4]float64{
		float64(r) / 257.0, float64(g) / 257.0,
		float64(b) / 257.0, float64(a) / 257.0,
	}
}

func blerp(c00, c10, c01, c11, tx, ty float64) float64 {
	return lerp(lerp(c00, c10, tx), lerp(c01, c11, tx), ty)
}

func lerp(a, b, t float64) float64 {
	return a + t*(b-a)
}

func clamp(v float64) uint8 {
	if v < 0 {
		return 0
	}
	if v > 255 {
		return 255
	}
	return uint8(v + 0.5)
}
