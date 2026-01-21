# Check for the existence of jtd-codegen
if ! command -v which jtd-codegen &> /dev/null
then
    echo "jtd-codegen could not be found. Please install it from https://github.com/jsontypedef/json-typedef"
    exit 1
fi

# Check that the composed.jtd.json file exists
if [ ! -f composed.jtd.json ]; then
    echo "composed.jtd.json file not found!"
    exit 1
fi

# Create output directories if they don't exist
mkdir -p types/generated_typescript
mkdir -p types/generated_go

# Generate code from JSON Type Definition files
jtd-codegen --typescript-out types/generated_typescript -- composed.jtd.json
jtd-codegen --go-out types/generated_go -- composed.jtd.json