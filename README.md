# Docker MCP for Cursor

A Docker Multi-Command Protocol (MCP) integration for Cursor IDE.

## Features

- Create and manage Docker containers directly from Cursor IDE
- Build Docker images
- Run Docker commands
- View container logs and stats
- Manage Docker volumes and networks

## Installation

1. Clone this repository:
```
git clone https://github.com/xvsadmin/cursor-docker-mcp.git
```

2. Install dependencies:
```
npm install
```

3. Build the MCP:
```
npm run build
```

4. Link to Cursor:
```
npm run link-cursor
```

## Usage

After installation, you can use Docker commands directly from Cursor through the MCP interface.

## Requirements

- Node.js 18+
- Cursor IDE
- Docker (installed and running on your machine)

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development mode: `npm run dev`

## License

MIT