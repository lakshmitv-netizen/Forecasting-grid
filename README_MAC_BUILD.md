# Building macOS Application

## Quick Start

To build a macOS .app file that can be opened offline and shared:

```bash
npm run dist-mac
```

Or use the build script:

```bash
./build-mac-app.sh
```

## Output

The .app file will be created in:
```
dist/mac/ManufacturingCloudForecast.app
```

## Creating a Zip File for Sharing

After building, create a zip file:

```bash
cd dist/mac
zip -r ManufacturingCloudForecast.app.zip ManufacturingCloudForecast.app
```

Or from project root:

```bash
zip -r ManufacturingCloudForecast-mac.zip dist/mac/
```

## First-Time Opening

When someone first opens the .app file, macOS may show a security warning. They need to:

1. Right-click the .app file
2. Select "Open"
3. Click "Open" in the security dialog

This only needs to be done once per machine.

## Requirements

- macOS (to build the .app file)
- Node.js 18.x
- npm 9.x
- All dependencies installed (`npm install`)

## Troubleshooting

See `BUILD_MAC_APP.md` for detailed troubleshooting information.


