# Tourney Library - Development Todo

## Project Overview

Building a Go library that compiles to WebAssembly (WASM) for use in JavaScript/TypeScript applications, with Protocol Buffers for type definitions.

## Technology Stack

- **Golang**: Main language for core logic
- **JSON Typedef (JTD) with jtd-codegen**: Type definitions and code generation
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

- [x] Initialize Go module (`go mod init`)
- [x] Create package.json for NPM distribution
- [ ] Set up directory structure (core/, cmd/wasm/, internal/, lib/, schemas/)
- [x] Install jtd-codegen as dev dependency (`npm install --save-dev jtd-codegen`)
- [x] Set up JTD schema directory

### Phase 2: JTD Schema Setup

- [x] Create `.jtd.json` schema files for type definitions
- [x] Define data structures using JSON Typedef format
- [x] Generate Go code using jtd-codegen
- [x] Generate TypeScript types using jtd-codegen
- [x] Add JTD code generation script to build process
- [ ] Document JTD schemas

### Phase 3: Core Go Logic

- [ ] Implement pure Go logic in `core/` directory
  - [ ] Keep code platform-agnostic (no syscall/js imports)
  - [ ] Use JTD-generated types
  - [ ] Write unit tests for core logic
  - [ ] Ensure testability without WASM runtime

  ### Core logic
  - [ ] Create tournament
  - [ ] Add Player method
  - [ ] Add a draw method
  - [ ] Generate Logic for progressing Draws
    - [ ] League
    - [ ] knockout
    - [ ] Interface for calling the function through other places
    - [ ] Pass in custom function for calculating next draw
  - [ ] Call Progress to the next draw stage

- [ ] Create internal helper packages as needed

### Phase 4: WASM Entry Point

- [ ] Create `cmd/wasm/main.go` as WASM entry point
- [ ] Import core logic from `core/` package
- [ ] Add syscall/js imports for JavaScript interop
- [ ] Implement exported functions using:
  - [ ] `js.Global().Set()` for traditional exports, OR
  - [ ] `//go:wasmexport` directives (Go 1.21+)
- [ ] Add error handling and type conversions
- [ ] Handle JSON serialization/deserialization at boundary using JTD-generated types

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
  - [ ] Implement JSON encode/decode helpers
- [ ] Create `lib/index.d.ts` TypeScript definitions
  - [ ] Use JTD-generated TypeScript types
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
# Generate Go types from JTD schemas
npx jtd-codegen --go-out=core/types --go-package=types schemas/*.jtd.json

# Generate TypeScript types from JTD schemas
npx jtd-codegen --typescript-out=lib/types schemas/*.jtd.json

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
- Use JTD-generated types for all data crossing the WASM boundary for type safety
- JSON serialization is used for data exchange between Go and JavaScript
- Consider WASM binary size optimization techniques
- Document memory management between Go and JavaScript
- Plan for versioning and backward compatibility
