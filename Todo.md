# Tourney Library - Development Todo

## Project Overview

Building a Go library that compiles to WebAssembly (WASM) for use in JavaScript/TypeScript applications, with Protocol Buffers for type definitions.

## Technology Stack

- **Golang**: Main language for core logic
- **Protocol Buffers (protobuf)**: Type definitions and serialization
- **WebAssembly (WASM)**: Compilation target
- **wasm_exec.js**: Glue code for JavaScript runtime
- **wasm_exec.d.ts**: TypeScript type definitions for WASM integration

---

## File Structure Setup

```
my-library/
├── go.mod                  # Go module definition
├── package.json            # NPM package configuration
├── core/                   # Pure Go logic (no syscall/js here)
│   └── logic.go
├── cmd/
│   └── wasm/               # Entry point for Wasm
│       └── main.go         # Imports core/ and uses syscall/js or //go:wasmexport
├── internal/               # Optional internal helpers
├── lib/                    # Output directory for npm
│   ├── library.wasm        # Compiled WASM binary
│   ├── index.js            # JS wrapper
│   └── index.d.ts          # TypeScript types
└── main.go                 # Optional: standard Go CLI or package entry
```

---

## Development Steps

### Phase 1: Project Initialization

- [ ] Initialize Go module (`go mod init`)
- [ ] Create package.json for NPM distribution
- [ ] Set up directory structure (core/, cmd/wasm/, internal/, lib/)
- [ ] Install Protocol Buffers compiler (protoc)
- [ ] Install Go protobuf plugins (`protoc-gen-go`)

### Phase 2: Protocol Buffers Setup

- [ ] Create `.proto` files for type definitions
- [ ] Define message types and services
- [ ] Generate Go code from protobuf definitions
- [ ] Add protobuf generation script to build process
- [ ] Document protobuf schema

### Phase 3: Core Go Logic

- [ ] Implement pure Go logic in `core/` directory
  - [ ] Keep code platform-agnostic (no syscall/js imports)
  - [ ] Use protobuf-generated types
  - [ ] Write unit tests for core logic
  - [ ] Ensure testability without WASM runtime
- [ ] Create internal helper packages as needed

### Phase 4: WASM Entry Point

- [ ] Create `cmd/wasm/main.go` as WASM entry point
- [ ] Import core logic from `core/` package
- [ ] Add syscall/js imports for JavaScript interop
- [ ] Implement exported functions using:
  - [ ] `js.Global().Set()` for traditional exports, OR
  - [ ] `//go:wasmexport` directives (Go 1.21+)
- [ ] Add error handling and type conversions
- [ ] Handle protobuf serialization/deserialization at boundary

### Phase 5: WASM Build Configuration

- [ ] Create build script for WASM compilation
  - [ ] Set `GOOS=js GOARCH=wasm`
  - [ ] Output to `lib/library.wasm`
  - [ ] Optimize for size with build flags
- [ ] Copy `wasm_exec.js` from Go installation to `lib/`
- [ ] Create or obtain `wasm_exec.d.ts` for TypeScript support

### Phase 6: JavaScript/TypeScript Wrapper

- [ ] Create `lib/index.js` wrapper
  - [ ] Load and instantiate WASM module
  - [ ] Expose Go functions as JavaScript API
  - [ ] Handle async initialization
  - [ ] Add error handling and type conversions
  - [ ] Implement protobuf encode/decode helpers
- [ ] Create `lib/index.d.ts` TypeScript definitions
  - [ ] Define types matching protobuf schemas
  - [ ] Export function signatures
  - [ ] Document public API

### Phase 7: Testing

- [ ] Write Go unit tests for core logic
- [ ] Write integration tests for WASM module
- [ ] Create JavaScript/TypeScript test suite
- [ ] Test in Node.js environment
- [ ] Test in browser environment
- [ ] Add CI/CD pipeline for automated testing

### Phase 8: Build & Distribution

- [ ] Automate full build process (Go + WASM + JS)
- [ ] Configure package.json for NPM publishing
  - [ ] Set entry points
  - [ ] Define exports for ESM/CJS
  - [ ] Add TypeScript type declarations
- [ ] Create README with usage examples
- [ ] Add API documentation
- [ ] Version and publish to NPM

### Phase 9: Optional Enhancements

- [ ] Create `main.go` for standalone Go CLI tool
- [ ] Add performance benchmarks
- [ ] Implement streaming/chunked processing
- [ ] Add debug/logging capabilities
- [ ] Create example projects
- [ ] Set up documentation website

---

## Build Commands Reference

```bash
# Generate protobuf code
protoc --go_out=. --go_opt=paths=source_relative proto/*.proto

# Build WASM
GOOS=js GOARCH=wasm go build -o lib/library.wasm cmd/wasm/main.go

# Copy WASM runtime
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" lib/

# Run tests
go test ./...

# Build for NPM
npm run build
```

---

## Notes

- Keep `core/` package free of syscall/js dependencies for better testability
- Use protobuf for all data crossing the WASM boundary for type safety
- Consider WASM binary size optimization techniques
- Document memory management between Go and JavaScript
- Plan for versioning and backward compatibility
