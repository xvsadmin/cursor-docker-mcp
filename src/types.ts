/**
 * Type definitions for Docker MCP
 */

// Docker container types
export interface DockerContainer {
  id: string;
  names: string[];
  image: string;
  imageID: string;
  command: string;
  created: number;
  ports: DockerPort[];
  labels: { [key: string]: string };
  state: string;
  status: string;
  networkSettings: {
    networks: { [key: string]: DockerNetwork };
  };
  mounts: DockerMount[];
}

export interface DockerPort {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
}

export interface DockerNetwork {
  IPAddress: string;
  Gateway: string;
  IPPrefixLen: number;
  MacAddress: string;
}

export interface DockerMount {
  Name?: string;
  Source: string;
  Destination: string;
  Driver?: string;
  Mode: string;
  RW: boolean;
  Propagation: string;
}

// Docker image types
export interface DockerImage {
  id: string;
  parentId: string;
  repoTags: string[];
  repoDigests: string[];
  created: number;
  size: number;
  virtualSize: number;
  labels: { [key: string]: string };
}

// Docker volume types
export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  labels: { [key: string]: string };
  scope: string;
  options: { [key: string]: string };
}

// Docker network types
export interface DockerNetworkDetail {
  name: string;
  id: string;
  created: string;
  scope: string;
  driver: string;
  enableIPv6: boolean;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  configOnly: boolean;
  configFrom: { network: string } | null;
  options: { [key: string]: string };
  ipam: {
    driver: string;
    options: { [key: string]: string } | null;
    config: { subnet: string; gateway: string }[];
  };
}

// MCP command types
export interface MCPCommand {
  type: string;
  payload: any;
}

export interface MCPResponse {
  type: string;
  payload: any;
  error?: string;
}

// Docker build types
export interface DockerBuildOptions {
  t: string;  // Tag
  dockerfile?: string;
  q?: boolean; // Quiet
  nocache?: boolean;
  pull?: boolean;
  rm?: boolean;
  forcerm?: boolean;
}

// Docker container creation options
export interface DockerCreateContainerOptions {
  name: string;
  Image: string;
  Env?: string[];
  Cmd?: string[];
  ExposedPorts?: { [port: string]: {} };
  HostConfig?: {
    Binds?: string[];
    PortBindings?: {
      [port: string]: {
        HostIp: string;
        HostPort: string;
      }[];
    };
    RestartPolicy?: {
      Name: string;
      MaximumRetryCount?: number;
    };
    NetworkMode?: string;
  };
}