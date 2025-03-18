/**
 * Docker service implementation for MCP
 */
import Docker from 'dockerode';
import * as fs from 'fs';
import * as path from 'path';
import { 
  DockerContainer, 
  DockerImage, 
  DockerVolume, 
  DockerNetworkDetail,
  DockerBuildOptions,
  DockerCreateContainerOptions
} from './types';

export class DockerService {
  private docker: Docker;

  constructor() {
    // Initialize Docker connection
    // This will use the default socket path or environment variables
    this.docker = new Docker();
  }

  /**
   * List all containers
   * @param all Include stopped containers
   */
  async listContainers(all: boolean = false): Promise<DockerContainer[]> {
    try {
      return await this.docker.listContainers({ all }) as DockerContainer[];
    } catch (error) {
      console.error('Error listing containers:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a container
   * @param id Container ID or name
   */
  async getContainer(id: string): Promise<DockerContainer> {
    try {
      const container = this.docker.getContainer(id);
      const info = await container.inspect();
      return info as unknown as DockerContainer;
    } catch (error) {
      console.error(`Error getting container ${id}:`, error);
      throw error;
    }
  }

  /**
   * Start a container
   * @param id Container ID or name
   */
  async startContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.start();
    } catch (error) {
      console.error(`Error starting container ${id}:`, error);
      throw error;
    }
  }

  /**
   * Stop a container
   * @param id Container ID or name
   */
  async stopContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.stop();
    } catch (error) {
      console.error(`Error stopping container ${id}:`, error);
      throw error;
    }
  }

  /**
   * Restart a container
   * @param id Container ID or name
   */
  async restartContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.restart();
    } catch (error) {
      console.error(`Error restarting container ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove a container
   * @param id Container ID or name
   * @param force Force removal
   * @param removeVolumes Remove associated volumes
   */
  async removeContainer(id: string, force: boolean = false, removeVolumes: boolean = false): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.remove({ force, v: removeVolumes });
    } catch (error) {
      console.error(`Error removing container ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get container logs
   * @param id Container ID or name
   * @param tail Number of lines to return from the end of the logs
   */
  async getContainerLogs(id: string, tail: number = 100): Promise<string> {
    try {
      const container = this.docker.getContainer(id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail.toString()
      });
      return logs.toString();
    } catch (error) {
      console.error(`Error getting logs for container ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new container
   * @param options Container creation options
   */
  async createContainer(options: DockerCreateContainerOptions): Promise<{ id: string }> {
    try {
      const container = await this.docker.createContainer(options);
      return { id: container.id };
    } catch (error) {
      console.error('Error creating container:', error);
      throw error;
    }
  }

  /**
   * List all images
   */
  async listImages(): Promise<DockerImage[]> {
    try {
      return await this.docker.listImages() as DockerImage[];
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  }

  /**
   * Pull an image from a registry
   * @param image Image name (e.g., 'node:14')
   */
  async pullImage(image: string): Promise<void> {
    try {
      await new Promise((resolve, reject) => {
        this.docker.pull(image, (err: Error, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }
          
          this.docker.modem.followProgress(stream, (err: Error, output: any[]) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(output);
          });
        });
      });
    } catch (error) {
      console.error(`Error pulling image ${image}:`, error);
      throw error;
    }
  }

  /**
   * Remove an image
   * @param id Image ID or name
   * @param force Force removal
   */
  async removeImage(id: string, force: boolean = false): Promise<void> {
    try {
      const image = this.docker.getImage(id);
      await image.remove({ force });
    } catch (error) {
      console.error(`Error removing image ${id}:`, error);
      throw error;
    }
  }

  /**
   * Build an image from a Dockerfile
   * @param contextPath Path to the build context
   * @param options Build options
   */
  async buildImage(contextPath: string, options: DockerBuildOptions): Promise<void> {
    try {
      const buildContext = fs.createReadStream(path.join(contextPath, 'Dockerfile'));
      
      await new Promise((resolve, reject) => {
        this.docker.buildImage(buildContext, options, (err: Error, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }
          
          this.docker.modem.followProgress(stream, (err: Error, output: any[]) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(output);
          });
        });
      });
    } catch (error) {
      console.error(`Error building image:`, error);
      throw error;
    }
  }

  /**
   * List all volumes
   */
  async listVolumes(): Promise<DockerVolume[]> {
    try {
      const volumes = await this.docker.listVolumes();
      return volumes.Volumes as DockerVolume[];
    } catch (error) {
      console.error('Error listing volumes:', error);
      throw error;
    }
  }

  /**
   * Create a volume
   * @param name Volume name
   */
  async createVolume(name: string): Promise<DockerVolume> {
    try {
      const volume = await this.docker.createVolume({ Name: name });
      return volume as DockerVolume;
    } catch (error) {
      console.error(`Error creating volume ${name}:`, error);
      throw error;
    }
  }

  /**
   * Remove a volume
   * @param name Volume name
   */
  async removeVolume(name: string): Promise<void> {
    try {
      const volume = this.docker.getVolume(name);
      await volume.remove();
    } catch (error) {
      console.error(`Error removing volume ${name}:`, error);
      throw error;
    }
  }

  /**
   * List all networks
   */
  async listNetworks(): Promise<DockerNetworkDetail[]> {
    try {
      const networks = await this.docker.listNetworks();
      return networks as DockerNetworkDetail[];
    } catch (error) {
      console.error('Error listing networks:', error);
      throw error;
    }
  }

  /**
   * Create a network
   * @param name Network name
   * @param driver Network driver
   */
  async createNetwork(name: string, driver: string = 'bridge'): Promise<{ id: string }> {
    try {
      const network = await this.docker.createNetwork({
        Name: name,
        Driver: driver
      });
      return { id: network.id };
    } catch (error) {
      console.error(`Error creating network ${name}:`, error);
      throw error;
    }
  }

  /**
   * Remove a network
   * @param id Network ID or name
   */
  async removeNetwork(id: string): Promise<void> {
    try {
      const network = this.docker.getNetwork(id);
      await network.remove();
    } catch (error) {
      console.error(`Error removing network ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get Docker version information
   */
  async getVersion(): Promise<any> {
    try {
      return await this.docker.version();
    } catch (error) {
      console.error('Error getting Docker version:', error);
      throw error;
    }
  }

  /**
   * Get Docker system information
   */
  async getInfo(): Promise<any> {
    try {
      return await this.docker.info();
    } catch (error) {
      console.error('Error getting Docker info:', error);
      throw error;
    }
  }

  /**
   * Get Docker system disk usage
   */
  async getDiskUsage(): Promise<any> {
    try {
      return await this.docker.df();
    } catch (error) {
      console.error('Error getting Docker disk usage:', error);
      throw error;
    }
  }
}