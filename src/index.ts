/**
 * Docker MCP for Cursor
 * Main entry point
 */
import * as WebSocket from 'ws';
import { DockerService } from './docker-service';
import { MCPCommand, MCPResponse } from './types';

// Define MCP protocol constants
const MCP_NAME = 'docker';
const MCP_VERSION = '0.1.0';
const DEFAULT_PORT = 9999;

class DockerMCP {
  private server: WebSocket.Server;
  private dockerService: DockerService;
  private clients: Set<WebSocket> = new Set();
  private port: number;

  constructor(port: number = DEFAULT_PORT) {
    this.port = port;
    this.dockerService = new DockerService();
    this.server = new WebSocket.Server({ port });

    this.initServer();
    this.logStartup();
  }

  private initServer(): void {
    this.server.on('connection', (ws: WebSocket) => {
      console.log('Client connected');
      this.clients.add(ws);

      // Send MCP info to client
      this.sendToClient(ws, {
        type: 'info',
        payload: {
          name: MCP_NAME,
          version: MCP_VERSION,
          commands: this.getSupportedCommands()
        }
      });

      ws.on('message', async (message: string) => {
        try {
          const command = JSON.parse(message) as MCPCommand;
          await this.handleCommand(ws, command);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(ws, 'Failed to process command', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    this.server.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private async handleCommand(ws: WebSocket, command: MCPCommand): Promise<void> {
    console.log(`Received command: ${command.type}`);

    try {
      switch (command.type) {
        // Container commands
        case 'listContainers':
          const containers = await this.dockerService.listContainers(command.payload?.all || false);
          this.sendToClient(ws, { type: 'containers', payload: containers });
          break;

        case 'getContainer':
          const container = await this.dockerService.getContainer(command.payload.id);
          this.sendToClient(ws, { type: 'container', payload: container });
          break;

        case 'startContainer':
          await this.dockerService.startContainer(command.payload.id);
          this.sendToClient(ws, { type: 'containerStarted', payload: { id: command.payload.id } });
          break;

        case 'stopContainer':
          await this.dockerService.stopContainer(command.payload.id);
          this.sendToClient(ws, { type: 'containerStopped', payload: { id: command.payload.id } });
          break;

        case 'restartContainer':
          await this.dockerService.restartContainer(command.payload.id);
          this.sendToClient(ws, { type: 'containerRestarted', payload: { id: command.payload.id } });
          break;

        case 'removeContainer':
          await this.dockerService.removeContainer(
            command.payload.id,
            command.payload.force || false,
            command.payload.removeVolumes || false
          );
          this.sendToClient(ws, { type: 'containerRemoved', payload: { id: command.payload.id } });
          break;

        case 'getContainerLogs':
          const logs = await this.dockerService.getContainerLogs(
            command.payload.id,
            command.payload.tail || 100
          );
          this.sendToClient(ws, { type: 'containerLogs', payload: { id: command.payload.id, logs } });
          break;

        case 'createContainer':
          const newContainer = await this.dockerService.createContainer(command.payload);
          this.sendToClient(ws, { type: 'containerCreated', payload: newContainer });
          break;

        // Image commands
        case 'listImages':
          const images = await this.dockerService.listImages();
          this.sendToClient(ws, { type: 'images', payload: images });
          break;

        case 'pullImage':
          await this.dockerService.pullImage(command.payload.image);
          this.sendToClient(ws, { type: 'imagePulled', payload: { image: command.payload.image } });
          break;

        case 'removeImage':
          await this.dockerService.removeImage(
            command.payload.id,
            command.payload.force || false
          );
          this.sendToClient(ws, { type: 'imageRemoved', payload: { id: command.payload.id } });
          break;

        case 'buildImage':
          await this.dockerService.buildImage(
            command.payload.contextPath,
            command.payload.options
          );
          this.sendToClient(ws, { type: 'imageBuilt', payload: { tag: command.payload.options.t } });
          break;

        // Volume commands
        case 'listVolumes':
          const volumes = await this.dockerService.listVolumes();
          this.sendToClient(ws, { type: 'volumes', payload: volumes });
          break;

        case 'createVolume':
          const volume = await this.dockerService.createVolume(command.payload.name);
          this.sendToClient(ws, { type: 'volumeCreated', payload: volume });
          break;

        case 'removeVolume':
          await this.dockerService.removeVolume(command.payload.name);
          this.sendToClient(ws, { type: 'volumeRemoved', payload: { name: command.payload.name } });
          break;

        // Network commands
        case 'listNetworks':
          const networks = await this.dockerService.listNetworks();
          this.sendToClient(ws, { type: 'networks', payload: networks });
          break;

        case 'createNetwork':
          const network = await this.dockerService.createNetwork(
            command.payload.name,
            command.payload.driver || 'bridge'
          );
          this.sendToClient(ws, { type: 'networkCreated', payload: network });
          break;

        case 'removeNetwork':
          await this.dockerService.removeNetwork(command.payload.id);
          this.sendToClient(ws, { type: 'networkRemoved', payload: { id: command.payload.id } });
          break;

        // System commands
        case 'getVersion':
          const version = await this.dockerService.getVersion();
          this.sendToClient(ws, { type: 'version', payload: version });
          break;

        case 'getInfo':
          const info = await this.dockerService.getInfo();
          this.sendToClient(ws, { type: 'info', payload: info });
          break;

        case 'getDiskUsage':
          const diskUsage = await this.dockerService.getDiskUsage();
          this.sendToClient(ws, { type: 'diskUsage', payload: diskUsage });
          break;

        default:
          this.sendError(ws, `Unknown command: ${command.type}`);
          break;
      }
    } catch (error) {
      console.error(`Error handling command ${command.type}:`, error);
      this.sendError(ws, `Failed to execute ${command.type}`, error);
    }
  }

  private sendToClient(ws: WebSocket, response: MCPResponse): void {
    ws.send(JSON.stringify(response));
  }

  private sendError(ws: WebSocket, message: string, error?: any): void {
    this.sendToClient(ws, { 
      type: 'error', 
      payload: { message }, 
      error: error ? error.toString() : undefined 
    });
  }

  private getSupportedCommands(): string[] {
    return [
      // Container commands
      'listContainers',
      'getContainer',
      'startContainer',
      'stopContainer',
      'restartContainer',
      'removeContainer',
      'getContainerLogs',
      'createContainer',
      
      // Image commands
      'listImages',
      'pullImage',
      'removeImage',
      'buildImage',
      
      // Volume commands
      'listVolumes',
      'createVolume',
      'removeVolume',
      
      // Network commands
      'listNetworks',
      'createNetwork',
      'removeNetwork',
      
      // System commands
      'getVersion',
      'getInfo',
      'getDiskUsage'
    ];
  }

  private logStartup(): void {
    console.log(`Docker MCP v${MCP_VERSION} started on port ${this.port}`);
    console.log(`Supported commands: ${this.getSupportedCommands().join(', ')}`);
  }
}

// Start the MCP
// The port can be specified via environment variable
const port = process.env.DOCKER_MCP_PORT ? parseInt(process.env.DOCKER_MCP_PORT, 10) : DEFAULT_PORT;
const mcp = new DockerMCP(port);

// Export types and service for use in other modules
export * from './types';
export { DockerService } from './docker-service';