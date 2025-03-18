/**
 * Tests for Docker service
 */
import { DockerService } from '../docker-service';

// Mock dockerode
jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => {
    return {
      listContainers: jest.fn().mockResolvedValue([
        {
          id: 'container1',
          names: ['/test-container'],
          image: 'test-image',
          imageID: 'sha256:1234567890',
          command: 'node index.js',
          created: 1630000000,
          ports: [],
          labels: {},
          state: 'running',
          status: 'Up 2 hours',
          networkSettings: {
            networks: {}
          },
          mounts: []
        }
      ]),
      listImages: jest.fn().mockResolvedValue([
        {
          id: 'image1',
          parentId: '',
          repoTags: ['test-image:latest'],
          repoDigests: [],
          created: 1630000000,
          size: 100000000,
          virtualSize: 100000000,
          labels: {}
        }
      ]),
      listVolumes: jest.fn().mockResolvedValue({
        Volumes: [
          {
            name: 'test-volume',
            driver: 'local',
            mountpoint: '/var/lib/docker/volumes/test-volume/_data',
            labels: {},
            scope: 'local',
            options: {}
          }
        ]
      }),
      listNetworks: jest.fn().mockResolvedValue([
        {
          name: 'test-network',
          id: 'network1',
          created: '2021-08-01T00:00:00.000Z',
          scope: 'local',
          driver: 'bridge',
          enableIPv6: false,
          internal: false,
          attachable: false,
          ingress: false,
          configOnly: false,
          configFrom: null,
          options: {},
          ipam: {
            driver: 'default',
            options: null,
            config: [{ subnet: '172.17.0.0/16', gateway: '172.17.0.1' }]
          }
        }
      ]),
      version: jest.fn().mockResolvedValue({
        Version: '20.10.8',
        ApiVersion: '1.41',
        MinAPIVersion: '1.12',
        GitCommit: 'hardcoded-commit',
        GoVersion: 'go1.16.6',
        Os: 'linux',
        Arch: 'amd64'
      }),
      info: jest.fn().mockResolvedValue({
        Containers: 1,
        Images: 1,
        Driver: 'overlay2',
        DriverStatus: [['Backing Filesystem', 'extfs']],
        SystemStatus: null,
        Plugins: {
          Volume: ['local'],
          Network: ['bridge', 'host', 'macvlan', 'null', 'overlay'],
          Authorization: null,
          Log: ['awslogs', 'fluentd', 'gcplogs', 'gelf', 'journald', 'json-file', 'local', 'logentries', 'splunk', 'syslog']
        },
        MemoryLimit: true,
        SwapLimit: true,
        KernelMemory: true,
        CpuCfsPeriod: true,
        CpuCfsQuota: true,
        CPUShares: true,
        CPUSet: true,
        IPv4Forwarding: true,
        BridgeNfIptables: true,
        BridgeNfIp6tables: true,
        Debug: false,
        NFd: 20,
        OomKillDisable: true,
        NGoroutines: 35,
        SystemTime: '2021-08-01T00:00:00.000Z',
        LoggingDriver: 'json-file',
        CgroupDriver: 'cgroupfs',
        NEventsListener: 0,
        KernelVersion: '5.4.0-84-generic',
        OperatingSystem: 'Ubuntu 20.04.2 LTS',
        OSType: 'linux',
        Architecture: 'x86_64',
        IndexServerAddress: 'https://index.docker.io/v1/',
        RegistryConfig: {
          AllowNondistributableArtifactsCIDRs: [],
          AllowNondistributableArtifactsHostnames: [],
          InsecureRegistryCIDRs: ['127.0.0.0/8'],
          IndexConfigs: {
            'docker.io': {
              Name: 'docker.io',
              Mirrors: [],
              Secure: true,
              Official: true
            }
          },
          Mirrors: []
        },
        NCPU: 4,
        MemTotal: 8000000000,
        DockerRootDir: '/var/lib/docker',
        HttpProxy: '',
        HttpsProxy: '',
        NoProxy: '',
        Name: 'test-host',
        Labels: [],
        ExperimentalBuild: false,
        ServerVersion: '20.10.8'
      }),
      df: jest.fn().mockResolvedValue({
        LayersSize: 1000000000,
        Images: [{ Size: 100000000, Containers: 1 }],
        Containers: [{ Size: 10000000, Image: 'test-image:latest' }],
        Volumes: [{ Name: 'test-volume', UsageData: { Size: 10000000 } }]
      }),
      getContainer: jest.fn().mockImplementation(() => {
        return {
          inspect: jest.fn().mockResolvedValue({
            id: 'container1',
            names: ['/test-container'],
            image: 'test-image',
            imageID: 'sha256:1234567890',
            command: 'node index.js',
            created: 1630000000,
            ports: [],
            labels: {},
            state: 'running',
            status: 'Up 2 hours',
            networkSettings: {
              networks: {}
            },
            mounts: []
          }),
          start: jest.fn().mockResolvedValue(undefined),
          stop: jest.fn().mockResolvedValue(undefined),
          restart: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
          logs: jest.fn().mockResolvedValue('Container logs here')
        };
      }),
      getImage: jest.fn().mockImplementation(() => {
        return {
          remove: jest.fn().mockResolvedValue(undefined)
        };
      }),
      getVolume: jest.fn().mockImplementation(() => {
        return {
          remove: jest.fn().mockResolvedValue(undefined)
        };
      }),
      getNetwork: jest.fn().mockImplementation(() => {
        return {
          remove: jest.fn().mockResolvedValue(undefined)
        };
      }),
      createVolume: jest.fn().mockResolvedValue({
        name: 'new-volume',
        driver: 'local',
        mountpoint: '/var/lib/docker/volumes/new-volume/_data',
        labels: {},
        scope: 'local',
        options: {}
      }),
      createNetwork: jest.fn().mockResolvedValue({
        id: 'new-network'
      }),
      createContainer: jest.fn().mockResolvedValue({
        id: 'new-container'
      }),
      pull: jest.fn(),
      modem: {
        followProgress: jest.fn().mockImplementation((stream, cb) => {
          cb(null, []);
        })
      },
      buildImage: jest.fn()
    };
  });
});

describe('DockerService', () => {
  let dockerService: DockerService;

  beforeEach(() => {
    dockerService = new DockerService();
  });

  it('should list containers', async () => {
    const containers = await dockerService.listContainers();
    expect(containers).toHaveLength(1);
    expect(containers[0].id).toBe('container1');
  });

  it('should list containers with all flag', async () => {
    const containers = await dockerService.listContainers(true);
    expect(containers).toHaveLength(1);
  });

  it('should get container details', async () => {
    const container = await dockerService.getContainer('container1');
    expect(container.id).toBe('container1');
  });

  it('should list images', async () => {
    const images = await dockerService.listImages();
    expect(images).toHaveLength(1);
    expect(images[0].id).toBe('image1');
  });

  it('should list volumes', async () => {
    const volumes = await dockerService.listVolumes();
    expect(volumes).toHaveLength(1);
    expect(volumes[0].name).toBe('test-volume');
  });

  it('should list networks', async () => {
    const networks = await dockerService.listNetworks();
    expect(networks).toHaveLength(1);
    expect(networks[0].name).toBe('test-network');
  });
});